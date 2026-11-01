import { useEffect, useState, type ReactNode } from 'react';
import { Package, Building2, Eye, ClipboardCheck, Loader2, AlertCircle, Users, UserX, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminAnalytics as AnalyticsData } from '@/types';

const RANGES = [7, 30, 90] as const;
type RangeDays = (typeof RANGES)[number];

function isAnalyticsPayload(value: unknown): value is AnalyticsData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<AnalyticsData>;
  return typeof v.totals === 'object' && v.totals !== null && Array.isArray(v.top_equipment) && Array.isArray(v.top_companies);
}

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function KpiCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${tone}`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-900">{value.toLocaleString()}</p>
      <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}

function VisitorSplit({ label, loggedIn, anonymous }: { label: string; loggedIn: number; anonymous: number }) {
  const total = loggedIn + anonymous;
  const loggedInPct = percent(loggedIn, total);
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-neutral-800">{label}</span>
        <span className="text-neutral-500">{total.toLocaleString()} total</span>
      </div>
      <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden flex">
        <div className="h-full bg-primary-600 transition-all duration-500" style={{ width: `${loggedInPct}%` }} />
        <div className="h-full bg-neutral-300 transition-all duration-500" style={{ width: `${100 - loggedInPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-500 mt-2">
        <span className="flex items-center gap-1.5"><Users size={12} className="text-primary-600" /> Signed in: {loggedIn.toLocaleString()} ({loggedInPct}%)</span>
        <span className="flex items-center gap-1.5"><UserX size={12} className="text-neutral-400" /> Anonymous: {anonymous.toLocaleString()} ({total === 0 ? 0 : 100 - loggedInPct}%)</span>
      </div>
    </div>
  );
}

function RankedList({ title, icon, empty, rows }: {
  title: string;
  icon: ReactNode;
  empty: string;
  rows: { key: string; name: string; total: number; logged_in: number; anonymous: number }[];
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-neutral-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 py-6 text-center">{empty}</p>
      ) : (
        <ol className="divide-y divide-neutral-100">
          {rows.map((row, index) => (
            <li key={row.key} className="flex items-center gap-3 py-3">
              <span className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{row.name}</p>
                <p className="text-xs text-neutral-500">
                  {row.logged_in} signed in · {row.anonymous} anonymous
                </p>
              </div>
              <span className="text-sm font-bold text-primary-700">{row.total.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState<RangeDays>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    supabase.rpc('get_admin_analytics', { p_days: days }).then(({ data: payload, error: rpcError }) => {
      if (!active) return;
      if (rpcError || !isAnalyticsPayload(payload)) {
        setData(null);
        setError(rpcError?.message ?? 'Analytics data could not be loaded.');
      } else {
        setData(payload);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [days]);

  const rangeSelector = (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => setDays(range)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            days === range ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {range}d
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-8 flex items-start gap-3 text-error-700 bg-error-50 border-error-200">
        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Analytics could not be loaded</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const t = data.totals;
  const equipmentLoggedIn = t.product_searches_logged_in;
  const equipmentAnonymous = t.product_searches_anonymous;
  const companyLoggedIn = t.contractor_searches_logged_in;
  const companyAnonymous = t.contractor_searches_anonymous;
  const opensLoggedIn = t.profile_opens_logged_in;
  const opensAnonymous = t.profile_opens_anonymous;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Site performance</h2>
          <p className="text-sm text-neutral-500">Activity over the last {days} days</p>
        </div>
        {rangeSelector}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Package size={18} className="text-primary-700" />}
          label="Equipment searches"
          value={equipmentLoggedIn + equipmentAnonymous}
          tone="bg-primary-50"
        />
        <KpiCard
          icon={<Building2 size={18} className="text-success-700" />}
          label="Company searches"
          value={companyLoggedIn + companyAnonymous}
          tone="bg-success-50"
        />
        <KpiCard
          icon={<Eye size={18} className="text-warning-700" />}
          label="Company profiles opened"
          value={opensLoggedIn + opensAnonymous}
          tone="bg-warning-50"
        />
        <KpiCard
          icon={<ClipboardCheck size={18} className="text-error-700" />}
          label="Pending verifications"
          value={t.pending_verifications}
          tone="bg-error-50"
        />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Signed-in vs anonymous visitors</h2>
        <p className="text-sm text-neutral-500 mb-6">How each type of activity splits between accounts and visitors without one.</p>
        <div className="space-y-6">
          <VisitorSplit label="Equipment searches" loggedIn={equipmentLoggedIn} anonymous={equipmentAnonymous} />
          <VisitorSplit label="Company searches" loggedIn={companyLoggedIn} anonymous={companyAnonymous} />
          <VisitorSplit label="Company profiles opened" loggedIn={opensLoggedIn} anonymous={opensAnonymous} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankedList
          title="Top equipment searched"
          icon={<Trophy size={18} className="text-warning-600" />}
          empty="No equipment searches recorded in this period yet."
          rows={data.top_equipment.map((row) => ({
            key: row.term,
            name: row.term,
            total: row.total,
            logged_in: row.logged_in,
            anonymous: row.anonymous,
          }))}
        />
        <RankedList
          title="Top companies opened"
          icon={<Trophy size={18} className="text-warning-600" />}
          empty="No company profiles opened in this period yet."
          rows={data.top_companies.map((row) => ({
            key: row.id,
            name: row.company_name,
            total: row.total,
            logged_in: row.logged_in,
            anonymous: row.anonymous,
          }))}
        />
      </div>
    </div>
  );
}
