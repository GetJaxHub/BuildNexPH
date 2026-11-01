import { useEffect, useState } from 'react';
import { Loader2, LogOut, ShieldAlert, ShieldCheck, BarChart3, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import VerificationQueue from '@/components/admin/VerificationQueue';

type AdminAccess = 'checking' | 'granted' | 'denied' | 'error';
type AdminTab = 'analytics' | 'verification';

const TABS: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'verification', label: 'Verification Queue', icon: ClipboardCheck },
];

export default function Admin() {
  const { user, loading, signOut } = useAuth();
  const [access, setAccess] = useState<AdminAccess>('checking');
  const [tab, setTab] = useState<AdminTab>('analytics');
  const userId = user?.id ?? null;

  useEffect(() => {
    document.title = 'Admin | BuildNexPH';
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setAccess('checking');
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!active) return;
      if (error) setAccess('error');
      else setAccess(data === true ? 'granted' : 'denied');
    });
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) return <AdminLogin />;

  if (access === 'checking') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (access !== 'granted') {
    const message =
      access === 'denied'
        ? 'This account does not have administrator access.'
        : 'We could not verify administrator access. Please try again.';
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={26} className="text-error-600" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Access denied</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-6">{message}</p>
          <button onClick={() => signOut()} className="btn-secondary w-full">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Admin Console</h1>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="btn-ghost !py-2 self-start sm:self-auto">
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-neutral-200 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'analytics' ? <AdminAnalytics /> : <VerificationQueue />}
    </div>
  );
}
