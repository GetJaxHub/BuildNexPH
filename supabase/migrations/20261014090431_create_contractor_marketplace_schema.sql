/*
# Contractor Marketplace Schema (Philippines)

## Overview
A B2B marketplace platform exclusive to Filipino contractors. Contractors sign up, create a company profile, list construction products/materials, and upload their government licenses and accreditation documents. Buyers can browse the marketplace, search/filter products, view contractor profiles, and see accreditation levels (AAA, AA, A, etc.).

## Tables

### categories
Product categories (e.g., Cement, Steel, Electrical, Plumbing).
- id (uuid PK)
- name (text, unique)
- slug (text, unique)
- icon (text, optional - lucide icon name)
- created_at (timestamptz)

### contractors
The contractor company profile. One per auth user.
- id (uuid PK)
- user_id (uuid FK auth.users, unique, DEFAULT auth.uid())
- company_name (text)
- description (text)
- accreditation_level (text: 'AAA', 'AA', 'A', 'B', 'C', 'Unranked')
- pcab_license_no (text - Philippine Contractors Accreditation Board)
- contact_person (text)
- phone (text)
- email (text)
- address (text)
- region (text - Philippine region)
- website (text)
- logo_url (text)
- banner_url (text)
- verified (boolean default false)
- created_at, updated_at (timestamptz)

### products
Items listed by contractors.
- id (uuid PK)
- contractor_id (uuid FK contractors)
- category_id (uuid FK categories, nullable)
- name (text)
- description (text)
- price (numeric(12,2))
- unit (text - e.g., per sack, per piece, per meter)
- stock_qty (int, default 0)
- image_url (text)
- sku (text)
- brand (text)
- created_at, updated_at (timestamptz)

### documents
Government/license documents uploaded by contractors.
- id (uuid PK)
- contractor_id (uuid FK contractors)
- document_type (text - e.g., PCAB License, DTI Registration, BIR, Mayor's Permit, PhilGEPS)
- document_name (text)
- file_url (text)
- license_number (text)
- issue_date (date)
- expiry_date (date)
- status (text: 'valid', 'expired', 'pending')
- created_at (timestamptz)

## Security (RLS)
- categories: public read (anon + authenticated), no public writes
- contractors: public read (anyone can browse), owner can insert/update (authenticated, own row)
- products: public read, owner (via contractor ownership) can insert/update/delete
- documents: public read (marketplace transparency), owner can insert/update/delete

All owner checks go through the contractors table's user_id.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  description text DEFAULT '',
  accreditation_level text NOT NULL DEFAULT 'Unranked',
  pcab_license_no text DEFAULT '',
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  region text DEFAULT '',
  website text DEFAULT '',
  logo_url text DEFAULT '',
  banner_url text DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_contractors" ON contractors;
CREATE POLICY "public_read_contractors" ON contractors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_contractor" ON contractors;
CREATE POLICY "insert_own_contractor" ON contractors FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_contractor" ON contractors;
CREATE POLICY "update_own_contractor" ON contractors FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0,
  unit text DEFAULT '',
  stock_qty int NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  sku text DEFAULT '',
  brand text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = products.contractor_id AND contractors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = products.contractor_id AND contractors.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = products.contractor_id AND contractors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = products.contractor_id AND contractors.user_id = auth.uid())
  );

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_url text DEFAULT '',
  license_number text DEFAULT '',
  issue_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'valid',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_documents" ON documents;
CREATE POLICY "public_read_documents" ON documents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = documents.contractor_id AND contractors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = documents.contractor_id AND contractors.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = documents.contractor_id AND contractors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contractors WHERE contractors.id = documents.contractor_id AND contractors.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_contractor_id ON products(contractor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_contractor_id ON documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractors_accreditation ON contractors(accreditation_level);
CREATE INDEX IF NOT EXISTS idx_contractors_region ON contractors(region);

-- Seed categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Cement & Concrete', 'cement-concrete', 'Blocks'),
  ('Steel & Metals', 'steel-metals', 'Layers'),
  ('Electrical & Lighting', 'electrical-lighting', 'Zap'),
  ('Plumbing & Water', 'plumbing-water', 'Droplets'),
  ('Hardware & Tools', 'hardware-tools', 'Wrench'),
  ('Paint & Finishes', 'paint-finishes', 'PaintRoller'),
  ('Roofing & Insulation', 'roofing-insulation', 'Home'),
  ('Wood & Lumber', 'wood-lumber', 'TreePine'),
  ('Heavy Equipment', 'heavy-equipment', 'Truck'),
  ('Safety & PPE', 'safety-ppe', 'HardHat')
ON CONFLICT (slug) DO NOTHING;
