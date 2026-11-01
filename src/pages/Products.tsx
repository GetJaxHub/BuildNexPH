import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Package, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { recordSearch } from '@/lib/analytics';
import type { Product, Category } from '@/types';
import { accreditationOrder } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

const ACCREDITATION_FILTERS = ['AAA', 'AA', 'A', 'B', 'C', 'Unranked'] as const;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const accFilter = searchParams.get('accreditation') ?? '';

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, contractor:contractors(*), category:categories(*)')
      .order('created_at', { ascending: false });

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    const { data } = await query;
    let results = (data as unknown as Product[]) ?? [];

    if (categorySlug) {
      results = results.filter((p) => p.category?.slug === categorySlug);
    }

    if (accFilter) {
      results = results.filter((p) => p.contractor?.accreditation_level === accFilter);
    }

    results.sort((a, b) => {
      const acA = a.contractor ? accreditationOrder[a.contractor.accreditation_level] : 0;
      const acB = b.contractor ? accreditationOrder[b.contractor.accreditation_level] : 0;
      return acB - acA;
    });

    setProducts(results);
    setLoading(false);
  }, [q, categorySlug, accFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (q) recordSearch('product', q);
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

  const activeFilterCount = [q, categorySlug, accFilter].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Products & Materials</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Browse construction materials from accredited Filipino contractors
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products, brands, descriptions..."
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

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-neutral-700">Filter Results</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={categorySlug}
                onChange={(e) => updateParam('category', e.target.value)}
                className="input"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Contractor Accreditation</label>
              <select
                value={accFilter}
                onChange={(e) => updateParam('accreditation', e.target.value)}
                className="input"
              >
                <option value="">All levels</option>
                {ACCREDITATION_FILTERS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
                <div className="h-5 bg-neutral-100 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-700">No products found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-500 mb-4">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
