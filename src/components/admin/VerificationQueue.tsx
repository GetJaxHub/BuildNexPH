import { useEffect, useState } from 'react';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Contractor, VerificationStatus } from '@/types';
import VerificationBadge from '@/components/admin/VerificationBadge';
import CompanyReviewPanel from '@/components/admin/CompanyReviewPanel';

const FILTERS: { value: VerificationStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export default function VerificationQueue() {
  const [companies, setCompanies] = useState<Contractor[]>([]);
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: true });
    if (queryError) {
      setError(queryError.message);
      setCompanies([]);
    } else {
      setError(null);
      setCompanies((data as Contractor[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const countFor = (status: VerificationStatus | 'all') =>
    status === 'all' ? companies.length : companies.filter((c) => c.verification_status === status).length;

  const visible = filter === 'all' ? companies : companies.filter((c) => c.verification_status === filter);
  const selected = companies.find((c) => c.id === selectedId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filter === f.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {f.label} <span className="opacity-75">({countFor(f.value)})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="card p-6 text-sm text-error-700 bg-error-50 border-error-200">
          Companies could not be loaded: {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-700">No companies here</h3>
          <p className="text-sm text-neutral-500 mt-1">Nothing matches this status right now.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((company) => (
            <li key={company.id}>
              <button
                onClick={() => setSelectedId(company.id)}
                className="card w-full p-4 flex items-center gap-4 text-left hover:shadow-md hover:border-primary-200 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={22} className="text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{company.company_name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {company.region || 'No region'} · Registered {formatDate(company.created_at)}
                  </p>
                </div>
                <VerificationBadge status={company.verification_status} />
                <ChevronRight size={18} className="text-neutral-400 flex-shrink-0 hidden sm:block" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <CompanyReviewPanel
          key={selected.id}
          contractor={selected}
          onClose={() => setSelectedId(null)}
          onSaved={() => {
            setSelectedId(null);
            loadCompanies();
          }}
        />
      )}
    </div>
  );
}
