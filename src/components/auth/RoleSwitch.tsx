import { Building2, ShoppingCart } from 'lucide-react';
import type { AccountType } from '@/lib/buyer';

const options = [
  { role: 'contractor' as const, label: 'For Contractors', hint: 'Sell & get listed', Icon: Building2 },
  { role: 'buyer' as const, label: 'For Buyers', hint: 'Find & contact suppliers', Icon: ShoppingCart },
];

/** "For Contractors | For Buyers" switch on sign-in and registration (same as the mobile app). */
export default function RoleSwitch({ value, onChange }: { value: AccountType; onChange: (r: AccountType) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-2 gap-3">
      {options.map(({ role, label, hint, Icon }) => {
        const active = role === value;
        return (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(role)}
            className={`text-left rounded-xl border-2 p-3 sm:p-4 transition-colors ${
              active ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <Icon size={22} className={active ? 'text-primary-600' : 'text-neutral-400'} />
            <span className={`block mt-2 font-semibold text-sm sm:text-base ${active ? 'text-primary-700' : 'text-neutral-900'}`}>{label}</span>
            <span className="block text-xs text-neutral-500 mt-0.5">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
