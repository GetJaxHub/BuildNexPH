/*
# Create Projects Table and File Storage

## Overview
Adds a new "Projects" feature to the contractor marketplace. Contractors can showcase
their completed construction projects with building names, descriptions, and uploaded images.
Also creates a Supabase Storage bucket for file uploads (project images, product images,
document files, and company logos/banners).

## New Tables

### projects
Showcases a contractor's completed construction projects.
- id (uuid PK)
- contractor_id (uuid FK contractors, ON DELETE CASCADE)
- building_name (text, not null) — name of the building/structure
- description (text) — project details
- location (text) — where the project is located
- project_date (date, optional) — when the project was completed
- image_urls (text[], default '{}') — array of image URLs (supports multiple images)
- created_at (timestamptz)

## Storage
### Bucket: contractor-uploads
A public bucket for storing:
- Project images
- Product images
- Document files (PDFs, images)
- Company logos and banners

## Security (RLS)

### projects table
- Public read (anyone can browse showcased projects)
- Owner (via contractor ownership) can insert/update/delete

### Storage policies (contractor-uploads bucket)
- Public read: anyone can view uploaded files (marketplace is public)
- Authenticated upload: only logged-in users can upload files
- Authenticated update/delete: users can manage their own files

## Important Notes
1. The storage bucket is PUBLIC so that uploaded images/files are viewable
   by anyone browsing the marketplace (consistent with the existing public-read
   RLS policies on contractors, products, and documents).
2. Storage policies allow any authenticated user to upload. RLS on the projects
   table enforces that only the contractor owner can create project records.
3. Files are organized by folder: contractors/{user_id}/...
*/

-- =====================
-- Projects table
-- =====================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  building_name text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  project_date date,
  image_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_projects" ON projects;
CREATE POLICY "public_read_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = projects.contractor_id AND contractors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = projects.contractor_id AND contractors.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = projects.contractor_id AND contractors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = projects.contractor_id AND contractors.user_id = auth.uid())
  );

-- Column grants (revoke anon writes, grant authenticated CRUD)
REVOKE INSERT, UPDATE, DELETE ON projects FROM anon;
GRANT SELECT ON projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON projects TO authenticated;

-- Index
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects(contractor_id);

-- =====================
-- Storage bucket
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-uploads', 'contractor-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Storage policies
-- =====================
-- Public read: anyone can view files
DROP POLICY IF EXISTS "Public read on contractor-uploads" ON storage.objects;
CREATE POLICY "Public read on contractor-uploads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'contractor-uploads');

-- Authenticated upload: any logged-in user can upload
DROP POLICY IF EXISTS "Authenticated upload to contractor-uploads" ON storage.objects;
CREATE POLICY "Authenticated upload to contractor-uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contractor-uploads');

-- Authenticated update: owners can update their own files
DROP POLICY IF EXISTS "Authenticated update on contractor-uploads" ON storage.objects;
CREATE POLICY "Authenticated update on contractor-uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'contractor-uploads' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'contractor-uploads');

-- Authenticated delete: owners can delete their own files
DROP POLICY IF EXISTS "Authenticated delete on contractor-uploads" ON storage.objects;
CREATE POLICY "Authenticated delete on contractor-uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'contractor-uploads' AND owner = auth.uid());
