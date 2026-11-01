export type AccreditationLevel = 'AAA' | 'AA' | 'A' | 'B' | 'C' | 'Unranked';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  description: string;
  accreditation_level: AccreditationLevel;
  pcab_license_no: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  region: string;
  website: string;
  logo_url: string;
  banner_url: string;
  verified: boolean;
  verification_status: VerificationStatus;
  verification_notes: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  contractor_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock_qty: number;
  image_url: string;
  sku: string;
  brand: string;
  created_at: string;
  updated_at: string;
  contractor?: Contractor;
  category?: Category | null;
}

export interface Document {
  id: string;
  contractor_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  license_number: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: 'valid' | 'expired' | 'pending';
  created_at: string;
}

export interface Project {
  id: string;
  contractor_id: string;
  building_name: string;
  description: string;
  location: string;
  project_date: string | null;
  image_urls: string[];
  created_at: string;
}

export interface ContractorWithRelations extends Contractor {
  products?: Product[];
  documents?: Document[];
  projects?: Project[];
}

export interface AdminAnalytics {
  totals: {
    product_searches_logged_in: number;
    product_searches_anonymous: number;
    contractor_searches_logged_in: number;
    contractor_searches_anonymous: number;
    profile_opens_logged_in: number;
    profile_opens_anonymous: number;
    pending_verifications: number;
    approved_companies: number;
    rejected_companies: number;
  };
  top_equipment: { term: string; total: number; logged_in: number; anonymous: number }[];
  top_companies: { id: string; company_name: string; total: number; logged_in: number; anonymous: number }[];
}
