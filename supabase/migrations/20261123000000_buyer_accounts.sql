/*
# Buyer accounts

Plain English: buyers (individuals or companies looking for materials or contractors) get their own
profile table, separate from contractors. The mobile app already signs buyers up with
account_type = 'buyer' in their login details; this migration copies those details into the buyers
table on signup and keeps buyers from ever getting a contractor profile.

1. New table `buyers` (one row per buyer login), private to its owner, readable by admins.
2. Trigger `on_auth_user_buyer_created` fills it from the signup details.
3. `handle_new_contractor_signup()` now skips buyer signups.
4. Backfills buyers who signed up before this migration.
*/

CREATE TABLE IF NOT EXISTS buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  buyer_type text NOT NULL DEFAULT 'individual' CHECK (buyer_type IN ('individual', 'company')),
  company_name text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  company_phone text NOT NULL DEFAULT '',
  business_line text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers read own profile" ON buyers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Buyers update own profile" ON buyers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION upsert_buyer_from_auth(u auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m jsonb := coalesce(u.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO buyers (user_id, full_name, phone, email, buyer_type, company_name, website, address, company_phone, business_line, updated_at)
  VALUES (
    u.id,
    left(btrim(coalesce(m ->> 'full_name', '')), 200),
    left(btrim(coalesce(m ->> 'phone', '')), 50),
    left(coalesce(u.email, ''), 200),
    CASE WHEN m ->> 'buyer_type' = 'company' THEN 'company' ELSE 'individual' END,
    left(btrim(coalesce(m ->> 'buyer_company_name', '')), 200),
    left(btrim(coalesce(m ->> 'buyer_website', '')), 300),
    left(btrim(coalesce(m ->> 'buyer_address', '')), 300),
    left(btrim(coalesce(m ->> 'buyer_company_phone', '')), 50),
    left(btrim(coalesce(m ->> 'buyer_business_line', '')), 100),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, email = EXCLUDED.email,
    buyer_type = EXCLUDED.buyer_type, company_name = EXCLUDED.company_name, website = EXCLUDED.website,
    address = EXCLUDED.address, company_phone = EXCLUDED.company_phone, business_line = EXCLUDED.business_line,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION handle_buyer_auth_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ->> 'account_type' = 'buyer' THEN
    PERFORM upsert_buyer_from_auth(NEW);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION upsert_buyer_from_auth(auth.users) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION handle_buyer_auth_change() FROM PUBLIC, anon, authenticated;

-- Insert covers signup; update covers "Edit my details" in the app (supabase.auth.updateUser).
DROP TRIGGER IF EXISTS on_auth_user_buyer_created ON auth.users;
CREATE TRIGGER on_auth_user_buyer_created
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_buyer_auth_change();

-- Contractor signups only: never create a contractor profile for a buyer.
CREATE OR REPLACE FUNCTION handle_new_contractor_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'company_name'
     AND coalesce(NEW.raw_user_meta_data ->> 'account_type', '') <> 'buyer' THEN
    INSERT INTO contractors (
      user_id, company_name, contact_person, phone, email, region, address, pcab_license_no
    )
    VALUES (
      NEW.id,
      left(btrim(coalesce(NEW.raw_user_meta_data ->> 'company_name', '')), 200),
      left(btrim(coalesce(NEW.raw_user_meta_data ->> 'contact_person', '')), 200),
      left(btrim(coalesce(NEW.raw_user_meta_data ->> 'phone', '')), 50),
      left(coalesce(NEW.email, ''), 200),
      left(btrim(coalesce(NEW.raw_user_meta_data ->> 'region', '')), 100),
      left(btrim(coalesce(NEW.raw_user_meta_data ->> 'address', '')), 300),
      left(btrim(coalesce(NEW.raw_user_meta_data ->> 'pcab_license_no', '')), 100)
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill buyers created by the app before this migration ran.
SELECT upsert_buyer_from_auth(u) FROM auth.users u WHERE u.raw_user_meta_data ->> 'account_type' = 'buyer';
