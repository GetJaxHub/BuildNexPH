import { businessLines, type BuyerProfile } from '@/lib/buyer';

/** Buyer details: name, contact number, individual or company (+ company details). Same fields as the mobile app. */
export default function BuyerForm({ value, onChange }: { value: BuyerProfile; onChange: (p: BuyerProfile) => void }) {
  const set = (k: keyof BuyerProfile) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const company = value.buyer_type === 'company';
  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="buyer-name">Full Name *</label>
        <input id="buyer-name" className="input" required value={value.full_name} onChange={set('full_name')} autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="buyer-phone">Contact Number *</label>
        <input id="buyer-phone" className="input" required type="tel" value={value.phone} onChange={set('phone')} placeholder="09XX XXX XXXX" autoComplete="tel" />
      </div>
      <div>
        <span className="label">Buying as</span>
        <div className="flex gap-2">
          {(['individual', 'company'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={value.buyer_type === t}
              onClick={() => onChange({ ...value, buyer_type: t })}
              className={`px-4 py-2 rounded-full border text-sm font-medium ${
                value.buyer_type === t ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {t === 'individual' ? 'Individual' : 'Company'}
            </button>
          ))}
        </div>
      </div>
      {company && (
        <>
          <div>
            <label className="label" htmlFor="buyer-company">Company Name *</label>
            <input id="buyer-company" className="input" required value={value.buyer_company_name} onChange={set('buyer_company_name')} autoComplete="organization" />
          </div>
          <div>
            <label className="label" htmlFor="buyer-line">Line of Business</label>
            <select id="buyer-line" className="input" value={value.buyer_business_line} onChange={set('buyer_business_line')}>
              <option value="">Select...</option>
              {businessLines.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="buyer-address">Company Address</label>
            <input id="buyer-address" className="input" value={value.buyer_address} onChange={set('buyer_address')} autoComplete="street-address" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="buyer-cphone">Company Contact Number</label>
              <input id="buyer-cphone" className="input" type="tel" value={value.buyer_company_phone} onChange={set('buyer_company_phone')} />
            </div>
            <div>
              <label className="label" htmlFor="buyer-web">Website</label>
              <input id="buyer-web" className="input" type="url" value={value.buyer_website} onChange={set('buyer_website')} placeholder="https://" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
