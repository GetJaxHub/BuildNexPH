// Same rules as the mobile app (buildnex-mobile/src/components/buyer-form.tsx) — keep in sync.

/**
 * Buyer details live in the login record (user_metadata) under buyer_* keys, tagged account_type: 'buyer'.
 * Never send "company_name" for a buyer: the database trigger handle_new_contractor_signup() creates a
 * contractor profile for any signup that has it. The buyers table is filled from this by a trigger.
 */
export interface BuyerProfile {
  full_name: string;
  phone: string;
  buyer_type: 'individual' | 'company';
  buyer_company_name: string;
  buyer_website: string;
  buyer_address: string;
  buyer_company_phone: string;
  buyer_business_line: string;
}

export type AccountType = 'contractor' | 'buyer';

export const emptyBuyer: BuyerProfile = {
  full_name: '', phone: '', buyer_type: 'individual',
  buyer_company_name: '', buyer_website: '', buyer_address: '', buyer_company_phone: '', buyer_business_line: '',
};

export const businessLines = [
  'Construction / General Contractor', 'Real Estate Developer', 'Architecture & Design', 'Engineering',
  'Hardware / Retail', 'Manufacturing', 'Government / LGU', 'Property Management', 'Other',
] as const;

/** Returns an error message, or null when the buyer profile is complete enough to save. */
export function validateBuyer(p: BuyerProfile): string | null {
  if (!p.full_name.trim()) return 'Enter your name.';
  if (!p.phone.trim()) return 'Enter your contact number.';
  if (p.buyer_type === 'company' && !p.buyer_company_name.trim()) return 'Enter your company name.';
  return null;
}

/** Trim everything and drop company fields for individuals. */
export function cleanBuyer(p: BuyerProfile): BuyerProfile {
  const t = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v).trim()])) as unknown as BuyerProfile;
  if (t.buyer_type === 'individual') {
    return { ...t, buyer_company_name: '', buyer_website: '', buyer_address: '', buyer_company_phone: '', buyer_business_line: '' };
  }
  return t;
}
