/*
# Site analytics: search and company profile tracking

Plain English: every search for equipment or companies, and every company profile opened, is recorded. Each record notes whether the visitor was signed in or anonymous. Only admins can read the aggregated results.

1. New tables
- `search_events`: one row per search. Stores the search type ('product' for equipment, 'contractor' for companies), the search text, the signed-in user (or empty for anonymous visitors), and the time.
- `profile_views`: one row per company profile opened. Stores the company, the signed-in user (or empty), and the time.

2. New functions
- `get_admin_analytics(days)`: admin-only. Returns totals split by signed-in vs anonymous, the top 10 searched equipment terms, and the top 10 opened companies for the chosen period.

3. Security changes
- Row level security enabled on both tables.
- Visitors (anonymous and signed in) may only insert rows; they cannot read any analytics rows. A signed-in visitor can only record events under their own account; anonymous events must have no account attached.
- Reading analytics happens only through `get_admin_analytics`, which checks admin access.

4. Important notes
- Records of a deleted account are kept but detached from the account, so the counts stay accurate.
- Search text is limited to 200 characters.
*/

CREATE TABLE IF NOT EXISTS search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_type text NOT NULL CHECK (search_type IN ('product', 'contractor')),
  query text NOT NULL CHECK (char_length(query) BETWEEN 1 AND 200),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_events_created_at_idx ON search_events (created_at);
CREATE INDEX IF NOT EXISTS search_events_type_query_idx ON search_events (search_type, query);

CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_views_contractor_idx ON profile_views (contractor_id, created_at);
CREATE INDEX IF NOT EXISTS profile_views_created_at_idx ON profile_views (created_at);

ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON search_events TO anon, authenticated;
GRANT INSERT ON profile_views TO anon, authenticated;

DROP POLICY IF EXISTS "insert_search_events" ON search_events;
CREATE POLICY "insert_search_events" ON search_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "insert_profile_views" ON profile_views;
CREATE POLICY "insert_profile_views" ON profile_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION get_admin_analytics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since_at timestamptz;
  result json;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_days IS NULL OR p_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'Invalid date range';
  END IF;

  since_at := now() - make_interval(days => p_days);

  SELECT json_build_object(
    'totals', json_build_object(
      'product_searches_logged_in', count(*) FILTER (WHERE s.search_type = 'product' AND s.user_id IS NOT NULL),
      'product_searches_anonymous', count(*) FILTER (WHERE s.search_type = 'product' AND s.user_id IS NULL),
      'contractor_searches_logged_in', count(*) FILTER (WHERE s.search_type = 'contractor' AND s.user_id IS NOT NULL),
      'contractor_searches_anonymous', count(*) FILTER (WHERE s.search_type = 'contractor' AND s.user_id IS NULL),
      'profile_opens_logged_in', (SELECT count(*) FROM profile_views pv WHERE pv.created_at >= since_at AND pv.user_id IS NOT NULL),
      'profile_opens_anonymous', (SELECT count(*) FROM profile_views pv WHERE pv.created_at >= since_at AND pv.user_id IS NULL),
      'pending_verifications', (SELECT count(*) FROM contractors WHERE verification_status = 'pending'),
      'approved_companies', (SELECT count(*) FROM contractors WHERE verification_status = 'approved'),
      'rejected_companies', (SELECT count(*) FROM contractors WHERE verification_status = 'rejected')
    ),
    'top_equipment', (
      SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT lower(btrim(s.query)) AS term,
               count(*) AS total,
               count(*) FILTER (WHERE s.user_id IS NOT NULL) AS logged_in,
               count(*) FILTER (WHERE s.user_id IS NULL) AS anonymous
        FROM search_events s
        WHERE s.search_type = 'product' AND s.created_at >= since_at
        GROUP BY 1
        ORDER BY total DESC, term
        LIMIT 10
      ) t
    ),
    'top_companies', (
      SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT c.id,
               c.company_name,
               count(pv.id) AS total,
               count(pv.id) FILTER (WHERE pv.user_id IS NOT NULL) AS logged_in,
               count(pv.id) FILTER (WHERE pv.user_id IS NULL) AS anonymous
        FROM profile_views pv
        JOIN contractors c ON c.id = pv.contractor_id
        WHERE pv.created_at >= since_at
        GROUP BY c.id, c.company_name
        ORDER BY total DESC, c.company_name
        LIMIT 10
      ) t
    )
  )
  INTO result
  FROM search_events s
  WHERE s.created_at >= since_at;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_admin_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_admin_analytics(integer) TO authenticated;
