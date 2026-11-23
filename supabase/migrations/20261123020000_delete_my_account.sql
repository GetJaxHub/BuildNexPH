/*
  In-app account deletion (required by Apple App Store guideline 5.1.1(v)).

  A signed-in user deletes their own auth user. Every table that references auth.users or
  contractors uses ON DELETE CASCADE or SET NULL, so the company profile, products, projects,
  licenses, buyer details and conversations go with it; analytics rows are kept anonymised.
*/
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
