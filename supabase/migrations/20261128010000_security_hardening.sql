/*
  Security hardening from the launch pentest.

  1. Website fields must be empty or an http(s) link. Stops a stored "javascript:" link on a public
     profile, which would run code in the visitor's browser and could steal their session (admins included).
  2. Messaging: only a registered buyer (has a buyers profile, no contractor profile) can start a
     conversation, and the server fills the buyer's name, company and preview fields so nobody can
     pose as someone else or plant a fake "last message".
  3. Document review: every document gets an admin review status. Contractors can't set it; adding or
     changing a document puts it back to pending. A company can only be approved once it has at least
     one document and every document is approved.
*/

-- 1. http(s) links only
ALTER TABLE public.contractors DROP CONSTRAINT IF EXISTS contractors_website_http;
ALTER TABLE public.contractors ADD CONSTRAINT contractors_website_http
  CHECK (website IS NULL OR website = '' OR website ~* '^https?://[^[:space:]]+$');

ALTER TABLE public.buyers DROP CONSTRAINT IF EXISTS buyers_website_http;
ALTER TABLE public.buyers ADD CONSTRAINT buyers_website_http
  CHECK (website = '' OR website ~* '^https?://[^[:space:]]+$');

-- 2. Registered buyers only, server-written conversation fields
DROP POLICY IF EXISTS "Buyers start conversations" ON public.conversations;
CREATE POLICY "Buyers start conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    buyer_user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.buyers b WHERE b.user_id = (SELECT auth.uid()))
    AND NOT EXISTS (SELECT 1 FROM public.contractors c WHERE c.user_id = (SELECT auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.fill_new_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  SELECT left(b.full_name, 200), left(b.company_name, 200)
    INTO NEW.buyer_name, NEW.buyer_company
    FROM public.buyers b WHERE b.user_id = NEW.buyer_user_id;
  NEW.buyer_name := coalesce(NEW.buyer_name, '');
  NEW.buyer_company := coalesce(NEW.buyer_company, '');
  NEW.last_message := '';
  NEW.last_sender_id := NULL;
  NEW.last_message_at := now();
  NEW.created_at := now();
  NEW.buyer_read_at := now();
  NEW.contractor_read_at := 'epoch';
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fill_new_conversation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_conversation_insert ON public.conversations;
CREATE TRIGGER on_conversation_insert
  BEFORE INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_new_conversation();

-- 3. Admin review of each document
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS review_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_review_status_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_review_status_check
  CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Documents of companies that were already approved count as reviewed.
UPDATE public.documents d SET review_status = 'approved', reviewed_at = now()
  FROM public.contractors c
 WHERE c.id = d.contractor_id AND c.verification_status = 'approved' AND d.review_status = 'pending';

-- Contractors (app roles) never set review fields; new or changed documents go back to pending.
CREATE OR REPLACE FUNCTION public.guard_document_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW; -- admin_review_document() and migrations run as the owner
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.document_type IS NOT DISTINCT FROM OLD.document_type
     AND NEW.document_name IS NOT DISTINCT FROM OLD.document_name
     AND NEW.file_url IS NOT DISTINCT FROM OLD.file_url
     AND NEW.license_number IS NOT DISTINCT FROM OLD.license_number
     AND NEW.issue_date IS NOT DISTINCT FROM OLD.issue_date
     AND NEW.expiry_date IS NOT DISTINCT FROM OLD.expiry_date THEN
    NEW.review_status := OLD.review_status;
    NEW.review_notes := OLD.review_notes;
    NEW.reviewed_at := OLD.reviewed_at;
  ELSE
    NEW.review_status := 'pending';
    NEW.review_notes := '';
    NEW.reviewed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_document_write ON public.documents;
CREATE TRIGGER on_document_write
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_document_review();

CREATE OR REPLACE FUNCTION public.admin_review_document(p_document_id uuid, p_status text, p_notes text)
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
    RAISE EXCEPTION 'Invalid review status';
  END IF;
  IF p_status = 'rejected' AND btrim(coalesce(p_notes, '')) = '' THEN
    RAISE EXCEPTION 'Add a reason before rejecting a document.';
  END IF;
  UPDATE documents
     SET review_status = p_status,
         review_notes = left(coalesce(p_notes, ''), 2000),
         reviewed_at = CASE WHEN p_status = 'pending' THEN NULL ELSE now() END
   WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_review_document(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_document(uuid, text, text) TO authenticated;

-- Company approval now requires every document to be approved first.
CREATE OR REPLACE FUNCTION public.admin_set_verification(p_contractor_id uuid, p_status text, p_notes text)
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

  IF p_status = 'approved' THEN
    IF NOT EXISTS (SELECT 1 FROM documents WHERE contractor_id = p_contractor_id) THEN
      RAISE EXCEPTION 'This company has not submitted any documents yet.';
    END IF;
    IF EXISTS (SELECT 1 FROM documents WHERE contractor_id = p_contractor_id AND review_status <> 'approved') THEN
      RAISE EXCEPTION 'Approve every document before approving the company.';
    END IF;
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
REVOKE EXECUTE ON FUNCTION public.admin_set_verification(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_verification(uuid, text, text) TO authenticated;
