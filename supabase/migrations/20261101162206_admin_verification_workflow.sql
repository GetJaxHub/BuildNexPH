/*
# Admin verification workflow for contractor companies

Plain English: admins (the three allowlisted email accounts) can review each company's profile and documents, then approve, reject, or reset its verification status with optional notes. Companies can see their status but cannot change it.

1. Modified tables
- `contractors`
  - `verification_status` (text): 'pending' (default), 'approved', or 'rejected'.
  - `verification_notes` (text): notes written by the reviewing admin.
  - `reviewed_at` (timestamptz): when the latest decision was made.
  - Existing contractors already marked verified are set to 'approved'.

2. New functions
- `is_admin()`: returns true when the signed-in account's email is one of the allowlisted admin emails.
- `admin_set_verification(contractor_id, status, notes)`: admin-only. Updates status, notes, review time, and keeps the existing `verified` flag in sync (true only when approved).

3. Security changes
- Signup could previously insert any contractor column, including `verified`. Table-wide INSERT is revoked and replaced with an explicit column list that excludes verification fields.
- `is_admin()` and `admin_set_verification()` are not callable by anonymous visitors.
- Companies cannot update verification columns (already the case, unchanged).

4. Important notes
- Admin emails are fixed in `is_admin()`. Changing the list requires a new migration.
- Email confirmation is off, so anyone who registers with an admin email before its owner does would hold admin access. Register the owners' accounts promptly or enable email confirmation.
*/

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractors_verification_status_check'
  ) THEN
    ALTER TABLE contractors
      ADD CONSTRAINT contractors_verification_status_check
      CHECK (verification_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

UPDATE contractors
SET verification_status = 'approved'
WHERE verified = true AND verification_status = 'pending';

REVOKE INSERT ON contractors FROM authenticated;
GRANT INSERT (
  user_id, company_name, description, contact_person, phone, email,
  address, region, website, logo_url, banner_url, pcab_license_no
) ON contractors TO authenticated;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'jakyz.mamba@mambaautomize.com',
    'jaketz21@gmail.com',
    'jakyz_mamba@hotmail.com'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION admin_set_verification(
  p_contractor_id uuid,
  p_status text,
  p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification status';
  END IF;

  UPDATE contractors
  SET verification_status = p_status,
      verified = (p_status = 'approved'),
      verification_notes = left(coalesce(p_notes, ''), 2000),
      reviewed_at = CASE WHEN p_status = 'pending' THEN NULL ELSE now() END,
      updated_at = now()
  WHERE id = p_contractor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_verification(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_verification(uuid, text, text) TO authenticated;
