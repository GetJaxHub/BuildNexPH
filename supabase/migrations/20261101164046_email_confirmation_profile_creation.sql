/*
# Email confirmation support: admin check and profile creation on signup

Plain English: a new company account now receives a confirmation email before it can sign in. The company profile is created automatically from the details entered at signup, so it exists as soon as the account is confirmed. Admin access now also requires a confirmed email address.

1. Modified functions
- `is_admin()`: now reads the account record directly and requires the email to be confirmed. This prevents someone from claiming an admin email address without owning it.

2. New functions and triggers
- `handle_new_contractor_signup()`: runs after each new account is created. When the signup included company details, it creates the matching company profile (pending verification, not verified).
- Trigger `on_auth_user_contractor_created` on the account table calls that function.

3. Security changes
- The signup function is not callable by any app role; it only runs through the trigger.
- Company details are trimmed and limited to 200 characters.
- Company profiles created this way start with verification status 'pending' and verified set to false, the same as before.

4. Important notes
- The email confirmation switch itself lives in the Supabase project's authentication settings and must be enabled there.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) IN (
        'jakyz.mamba@mambaautomize.com',
        'jaketz21@gmail.com',
        'jakyz_mamba@hotmail.com'
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION handle_new_contractor_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'company_name' THEN
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

REVOKE EXECUTE ON FUNCTION handle_new_contractor_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_contractor_created ON auth.users;
CREATE TRIGGER on_auth_user_contractor_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_contractor_signup();
