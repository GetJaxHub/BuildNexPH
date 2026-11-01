import { supabase } from '@/lib/supabase';

export async function recordSearch(searchType: 'product' | 'contractor', query: string) {
  const term = query.trim();
  if (!term) return;
  const { error } = await supabase
    .from('search_events')
    .insert({ search_type: searchType, query: term.slice(0, 200) });
  if (error) console.warn('Search analytics not recorded:', error.message);
}

export async function recordProfileView(contractorId: string) {
  const { error } = await supabase.from('profile_views').insert({ contractor_id: contractorId });
  if (error) console.warn('Profile analytics not recorded:', error.message);
}
