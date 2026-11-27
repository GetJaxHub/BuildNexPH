/*
  Launch scaling (see the launch readiness review).

  1. contractors.accreditation_rank: a sortable number for the accreditation level, so listings can be
     sorted and paginated in the database instead of downloading every row to sort on the phone.
  2. Trigram indexes so the '%term%' searches on contractors and products stop scanning the whole table.
  3. Index-friendly read rule for conversations (no per-row function call).
  4. Upload limits on the contractor-uploads bucket (size and file types), enforced by Storage.
*/

-- 1. Sortable accreditation rank (mirrors accreditationOrder in both apps)
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS accreditation_rank smallint
  GENERATED ALWAYS AS (
    CASE accreditation_level
      WHEN 'AAA' THEN 6 WHEN 'AA' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS contractors_rank_created_idx ON public.contractors (accreditation_rank DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS contractors_verified_idx ON public.contractors (verified) WHERE verified;
CREATE INDEX IF NOT EXISTS products_created_idx ON public.products (created_at DESC);

-- 2. Trigram search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS contractors_company_name_trgm ON public.contractors USING gin (company_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS contractors_description_trgm  ON public.contractors USING gin (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS contractors_address_trgm      ON public.contractors USING gin (address extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_name_trgm        ON public.products USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_description_trgm ON public.products USING gin (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_brand_trgm       ON public.products USING gin (brand extensions.gin_trgm_ops);

-- 3. Conversations: same access as is_conversation_member(), written so Postgres can use the indexes
DROP POLICY IF EXISTS "Members read conversations" ON public.conversations;
CREATE POLICY "Members read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (
    buyer_user_id = (SELECT auth.uid())
    OR contractor_id IN (SELECT id FROM public.contractors WHERE user_id = (SELECT auth.uid()))
  );

-- 4. Upload limits: 10 MB, images and PDFs only
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']
WHERE id = 'contractor-uploads';
