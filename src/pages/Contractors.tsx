import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Building2 } from 'lucide-react';
import { recordSearch } from '@/lib/analytics';
import { philippineRegions } from '@/lib/utils';
import { fetchContractors, productCountOf, usePaged } from '@/lib/listings';
import ContractorCard from '@/components/ContractorCard';

const ACCREDITATION_FILTERS = ['AAA', 'AA', 'A', 'B', 'C', 'Unranked'] as const;

export default function Contractors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') ?? '';
  const accFilter = searchParams.get('accreditation') ?? '';
  const regionFilter = searchParams.get('region') ?? '';
  const verifiedOnly = searchParams.get('verified') === '1';

  const [searchInput, setSearchInput] = useState(q);

  const fetchPage = useCallback(
    (from: number) => fetchContractors({ q, acc: accFilter, region: regionFilter, verified: verifiedOnly }, from),
    [q, accFilter, regionFilter, verifiedOnly]);
  const { rows: contractors, total, loading, loadingMore, hasMore, loadMore } = usePaged(fetchPage);

  useEffect(() => {
    if (q) recordSearch('contractor', q);
  }, [q]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  const activeFilterCount = [q, accFilter, regionFilter, verifiedOnly ? '1' : ''].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Contractors Directory</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Find verified Filipino contractors by accreditation level and region
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by company name, description..."
            className="input pl-11"
          />
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary relative ${showFilters ? 'border-primary-300 bg-primary-50' : ''}`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-neutral-700">Filter Contractors</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Accreditation Level</label>
              <select value={accFilter} onChange={(e) => updateParam('accreditation', e.target.value)} className="input">
                <option value="">All levels</option>
                {ACCREDITATION_FILTERS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Region</label>
              <select value={regionFilter} onChange={(e) => updateParam('region', e.target.value)} className="input">
                <option value="">All regions</option>
                {philippineRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Verification</label>
              <select
                value={verifiedOnly ? '1' : ''}
                onChange={(e) => updateParam('verified', e.target.value === '1' ? '1' : '')}
                className="input"
              >
                <option value="">All contractors</option>
                <option value="1">Verified only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-24 bg-neutral-100 animate-pulse" />
              <div className="px-5 pb-5 -mt-10">
                <div className="w-16 h-16 rounded-xl bg-neutral-100 animate-pulse mb-3" />
                <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4 mb-2" />
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : contractors.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-700">No contractors found</h3>
          <p className="text-sm text-neutral-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-500 mb-4">
            {total} {total === 1 ? 'contractor' : 'contractors'} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {contractors.map((c) => (
              <ContractorCard key={c.id} contractor={c} productCount={productCountOf(c)} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-secondary !px-6 !py-2.5">
                {loadingMore ? 'Loading…' : `Show more contractors`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
