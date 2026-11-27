import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Building2, ShieldCheck, TrendingUp,
  ArrowRight, Award, CheckCircle2, Layers,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Contractor, Category } from '@/types';
import { fetchContractors, fetchStats } from '@/lib/listings';
import ProductCard from '@/components/ProductCard';
import ContractorCard from '@/components/ContractorCard';
import AccreditationBadge from '@/components/AccreditationBadge';

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topContractors, setTopContractors] = useState<Contractor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ products: 0, contractors: 0, verified: 0 });

  useEffect(() => {
    (async () => {
      const [prodRes, top, catRes, counts] = await Promise.all([
        supabase.from('products').select('*, contractor:contractors(*)').order('created_at', { ascending: false }).limit(8),
        fetchContractors({}, 0, 6),
        supabase.from('categories').select('*').order('name'),
        fetchStats(),
      ]);

      if (prodRes.data) setFeaturedProducts(prodRes.data as unknown as Product[]);
      setTopContractors(top.rows);
      setStats(counts);
      if (catRes.data) setCategories(catRes.data as Category[]);
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-neutral-900 to-neutral-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(58,158,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(251,191,36,0.1) 0%, transparent 50%)',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 border border-primary-500/30 px-4 py-1.5 mb-6">
              <ShieldCheck size={14} className="text-primary-400" />
              <span className="text-xs font-semibold text-primary-300">Philippines' #1 Contractor Marketplace</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight text-balance">
              Connect with <span className="text-primary-400">accredited</span> Filipino contractors and suppliers
            </h1>
            <p className="text-neutral-400 text-lg mt-5 max-w-2xl leading-relaxed">
              The exclusive B2B marketplace where verified contractors showcase their products,
              government licenses, and accreditation records — from PCAB to PhilGEPS.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-8 flex gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, materials, brands..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 px-12 py-3.5 text-sm text-white placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
              <button type="submit" className="btn-primary !rounded-xl !py-3.5">
                Search
              </button>
            </form>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10">
              <div>
                <div className="text-2xl font-bold text-white">{stats.contractors}</div>
                <div className="text-xs text-neutral-500">Contractors</div>
              </div>
              <div className="w-px h-8 bg-neutral-700" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.products}</div>
                <div className="text-xs text-neutral-500">Products Listed</div>
              </div>
              <div className="w-px h-8 bg-neutral-700" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.verified}</div>
                <div className="text-xs text-neutral-500">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900">Browse by Category</h2>
            <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="card p-4 text-center group hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary-100 transition-colors">
                  <Layers size={20} />
                </div>
                <span className="text-xs font-medium text-neutral-700 line-clamp-2">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Accreditation highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 bg-gradient-to-r from-neutral-900 to-neutral-800 border-neutral-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Award size={28} className="text-amber-950" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Accreditation Highlights</h3>
                <p className="text-neutral-400 text-sm mt-0.5">
                  We surface contractors with outstanding PCAB records — AAA+, AA, and A-rated companies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AccreditationBadge level="AAA" size="lg" />
              <AccreditationBadge level="AA" size="lg" />
              <AccreditationBadge level="A" size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Latest Products</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Fresh listings from accredited contractors</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Top Contractors */}
      {topContractors.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Top-Rated Contractors</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Sorted by accreditation level</p>
            </div>
            <Link to="/contractors" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topContractors.map((c) => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        </section>
      )}

      {/* CTA for contractors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 md:p-12 bg-gradient-to-br from-primary-600 to-primary-800 border-primary-700 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Are you a contractor?</h2>
          <p className="text-primary-100 mt-3 max-w-xl mx-auto leading-relaxed">
            Join BuildNexPH today. List your products, upload your government documents,
            and let buyers discover your accreditation record.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link to="/signup" className="btn bg-white text-primary-700 hover:bg-primary-50 !py-3 !px-6">
              Register Your Company
            </Link>
            <Link to="/contractors" className="btn border border-white/30 text-white hover:bg-white/10 !py-3 !px-6">
              Browse Contractors
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-primary-100 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Free to join</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Verified profiles</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={14} /> Reach more buyers</span>
          </div>
        </div>
      </section>
    </div>
  );
}
