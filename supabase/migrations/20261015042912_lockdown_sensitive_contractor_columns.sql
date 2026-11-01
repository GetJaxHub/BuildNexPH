/*
# Lock down sensitive contractor columns

## Problem
The contractors table allows the authenticated owner to UPDATE any column, including
`accreditation_level` and `verified`. A contractor could self-assign "AAA" accreditation
or mark themselves as "verified" through the Supabase client, bypassing admin review.

## Fix
1. REVOKE column-level UPDATE privileges on `accreditation_level` and `verified`
   from both `anon` and `authenticated` roles.
2. GRANT UPDATE on all other columns explicitly (so the existing UPDATE policy still works
   for the non-sensitive columns).
3. The RLS UPDATE policy remains in place — this is defense-in-depth on top of it:
   even if the policy allowed the write, the role lacks UPDATE privilege on those columns.

## Security Impact
- Contractors can no longer self-assign accreditation levels (AAA, AA, A, etc.)
- Contractors can no longer self-mark as verified
- Only service-role (admin) operations can set these columns
- All other profile fields (name, description, phone, address, etc.) remain editable
*/

-- Revoke broad table-level UPDATE (we'll grant column-level instead)
REVOKE UPDATE ON contractors FROM anon, authenticated;

-- Revoke all other write operations from anon on contractors
REVOKE INSERT, DELETE ON contractors FROM anon;

-- Grant UPDATE on safe columns only
GRANT UPDATE (
  company_name,
  description,
  pcab_license_no,
  contact_person,
  phone,
  email,
  address,
  region,
  website,
  logo_url,
  banner_url,
  updated_at
) ON contractors TO authenticated;

-- Grant INSERT on all columns EXCEPT verified and accreditation_level
-- (INSERT still needs RLS policy to pass, which requires auth.uid() = user_id)
-- accreditation_level has DEFAULT 'Unranked' so it's fine to exclude from INSERT
GRANT INSERT (
  user_id,
  company_name,
  description,
  pcab_license_no,
  contact_person,
  phone,
  email,
  address,
  region,
  website,
  logo_url,
  banner_url
) ON contractors TO authenticated;

-- Ensure anon can only SELECT (read) contractors — no writes
-- (Already the case from RLS, but explicit is better)
GRANT SELECT ON contractors TO anon, authenticated;

-- Same treatment for products: revoke anon writes
REVOKE INSERT, UPDATE, DELETE ON products FROM anon;
GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

-- Same treatment for documents: revoke anon writes
REVOKE INSERT, UPDATE, DELETE ON documents FROM anon;
GRANT SELECT ON documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON documents TO authenticated;

-- Same treatment for categories: revoke all writes from anon and authenticated
-- (categories are admin-managed, seeded data)
REVOKE INSERT, UPDATE, DELETE ON categories FROM anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
