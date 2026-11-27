import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Contractor, Product } from '@/types';

/**
 * Server-side filtered, sorted and paginated listings (same file in the mobile app: src/lib/listings.ts).
 * Sorting by accreditation uses contractors.accreditation_rank (migration 20261128000000), so the database
 * does the work and each screen downloads one page instead of the whole table.
 */
export const PAGE_SIZE = 20;

// PostgREST .or() uses commas and parentheses as syntax; % and * are wildcards.
export const safeTerm = (q: string) => q.replace(/[,()%*\\]/g, ' ').trim();

export type ContractorRow = Contractor & { products?: { count: number }[] };
export const productCountOf = (c: ContractorRow) => c.products?.[0]?.count ?? 0;

export async function fetchContractors(
  f: { q?: string; acc?: string; region?: string; verified?: boolean },
  from = 0,
  size = PAGE_SIZE,
) {
  let query = supabase
    .from('contractors')
    .select('*, products(count)', { count: 'exact' })
    .order('accreditation_rank', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + size - 1);
  const term = safeTerm(f.q ?? '');
  if (term) query = query.or(`company_name.ilike.%${term}%,description.ilike.%${term}%,address.ilike.%${term}%`);
  if (f.acc) query = query.eq('accreditation_level', f.acc);
  if (f.region) query = query.eq('region', f.region);
  if (f.verified) query = query.eq('verified', true);
  const { data, count, error } = await query;
  return { rows: (data as ContractorRow[] | null) ?? [], total: count ?? 0, error };
}

export async function fetchProducts(
  f: { q?: string; categoryId?: string; categorySlug?: string; acc?: string },
  from = 0,
  size = PAGE_SIZE,
) {
  // !inner turns the embed into a join, so filters on the contractor or category apply to the products.
  const category = f.categorySlug ? 'category:categories!inner(*)' : 'category:categories(*)';
  let query = supabase
    .from('products')
    .select(`*, contractor:contractors!inner(*), ${category}`, { count: 'exact' })
    .order('contractor(accreditation_rank)', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + size - 1);
  const term = safeTerm(f.q ?? '');
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`);
  if (f.categoryId) query = query.eq('category_id', f.categoryId);
  if (f.categorySlug) query = query.eq('category.slug', f.categorySlug);
  if (f.acc) query = query.eq('contractor.accreditation_level', f.acc);
  const { data, count, error } = await query;
  return { rows: (data as unknown as Product[] | null) ?? [], total: count ?? 0, error };
}

/** Homepage numbers via count-only requests (no rows downloaded). */
export async function fetchStats() {
  const [p, c, v] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('contractors').select('id', { count: 'exact', head: true }),
    supabase.from('contractors').select('id', { count: 'exact', head: true }).eq('verified', true),
  ]);
  return { products: p.count ?? 0, contractors: c.count ?? 0, verified: v.count ?? 0 };
}

/**
 * One paginated list: first page on load and whenever fetchPage changes (new filters), more on demand.
 * A request counter drops responses that arrive after the filters changed.
 */
export function usePaged<T>(fetchPage: (from: number) => Promise<{ rows: T[]; total: number }>) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const req = useRef(0);

  const reload = useCallback(async () => {
    const id = ++req.current;
    const r = await fetchPage(0);
    if (id !== req.current) return;
    setRows(r.rows);
    setTotal(r.total);
    setLoading(false);
  }, [fetchPage]);

  useEffect(() => { reload(); }, [reload]);

  const loadMore = useCallback(async () => {
    if (loadingMore || rows.length >= total) return;
    const id = req.current;
    setLoadingMore(true);
    const r = await fetchPage(rows.length);
    setLoadingMore(false);
    if (id !== req.current) return;
    setRows((prev) => [...prev, ...r.rows]);
    setTotal(r.total);
  }, [fetchPage, loadingMore, rows.length, total]);

  return { rows, total, loading, loadingMore, hasMore: rows.length < total, reload, loadMore };
}
