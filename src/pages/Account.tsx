import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Building2, Globe, Loader2, MapPin, MessageSquare, Phone, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BuyerForm from '@/components/auth/BuyerForm';
import AccountSettingsTab from '@/components/dashboard/AccountSettingsTab';
import { cleanBuyer, emptyBuyer, validateBuyer } from '@/lib/buyer';

/** Buyer account: details + edit. Contractors use the Dashboard instead. */
export default function Account() {
  const { user, accountType, buyer, loading, updateBuyer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyBuyer);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;
  }
  if (!user) return <Navigate to="/signin?as=buyer" replace />;
  if (accountType !== 'buyer' || !buyer) return <Navigate to="/dashboard" replace />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validateBuyer(form);
    if (invalid) return setError(invalid);
    setSaving(true);
    const res = await updateBuyer(cleanBuyer(form));
    setSaving(false);
    if (res.error) return setError(res.error);
    setEditing(false);
  };

  const company = buyer.buyer_type === 'company';
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Account</h1>
        <p className="text-sm text-neutral-500 mt-1">Signed in as {user.email}</p>
      </div>

      {editing ? (
        <form onSubmit={save} className="card p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          <BuyerForm value={form} onChange={setForm} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-neutral-900">{buyer.full_name}</h2>
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-primary-50 text-primary-700">Buyer</span>
          </div>
          <Detail Icon={Phone} text={buyer.phone} />
          {company ? (
            <>
              <Detail Icon={Building2} text={buyer.buyer_company_name} />
              {buyer.buyer_business_line && <Detail Icon={Briefcase} text={buyer.buyer_business_line} />}
              {buyer.buyer_address && <Detail Icon={MapPin} text={buyer.buyer_address} />}
              {buyer.buyer_company_phone && <Detail Icon={Phone} text={`${buyer.buyer_company_phone} (company)`} />}
              {buyer.buyer_website && <Detail Icon={Globe} text={buyer.buyer_website} />}
            </>
          ) : <Detail Icon={User} text="Individual buyer" />}
          <button onClick={() => { setForm({ ...emptyBuyer, ...buyer }); setError(null); setEditing(true); }} className="btn-secondary !py-2 mt-2">
            Edit my details
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/messages" className="card p-5 hover:border-primary-300 transition-colors">
          <MessageSquare size={20} className="text-primary-600" />
          <p className="font-semibold text-neutral-900 mt-2">Messages</p>
          <p className="text-xs text-neutral-500">Your conversations with suppliers</p>
        </Link>
        <Link to="/products" className="card p-5 hover:border-primary-300 transition-colors">
          <ShoppingCart size={20} className="text-primary-600" />
          <p className="font-semibold text-neutral-900 mt-2">Browse products</p>
          <p className="text-xs text-neutral-500">Materials and supplies</p>
        </Link>
        <Link to="/contractors" className="card p-5 hover:border-primary-300 transition-colors">
          <Building2 size={20} className="text-primary-600" />
          <p className="font-semibold text-neutral-900 mt-2">Find contractors</p>
          <p className="text-xs text-neutral-500">Verified and accredited</p>
        </Link>
      </div>
      <div className="mt-8"><AccountSettingsTab /></div>
    </div>
  );
}

function Detail({ Icon, text }: { Icon: typeof Phone; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-600">
      <Icon size={14} className="text-neutral-400 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
