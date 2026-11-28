import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Step 2 of password reset. The emailed link signs the user in with a recovery session
 * (supabase-js reads it from the URL); here they choose a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady('ok');
    });
    // The URL is processed on load; give it a moment before declaring the link bad.
    const t = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setReady((cur) => (cur === 'ok' || s.session ? 'ok' : 'invalid'));
    }, 1500);
    const hashError = new URLSearchParams(window.location.hash.slice(1)).get('error_description');
    if (hashError) { setError(hashError.replace(/\+/g, ' ')); setReady('invalid'); }
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSaving(true);
    const { data, error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) return setError(err.message);
    setDone(true);
    const buyer = data.user?.user_metadata?.account_type === 'buyer';
    setTimeout(() => navigate(buyer ? '/account' : '/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/image.png" alt="BuildNexPH" className="w-12 h-12 rounded-xl object-cover" />
            <span className="font-display font-extrabold text-2xl text-neutral-900">
              BuildNex<span className="text-primary-600">PH</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Choose a new password</h1>
        </div>

        <div className="card p-6">
          {ready === 'checking' ? (
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
          ) : done ? (
            <div className="text-center space-y-3">
              <CheckCircle2 size={40} className="text-success-600 mx-auto" />
              <p className="text-sm text-neutral-600">Your password has been changed. Taking you to your account…</p>
            </div>
          ) : ready === 'invalid' ? (
            <div className="text-center space-y-4">
              <AlertCircle size={36} className="text-error-600 mx-auto" />
              <p className="text-sm text-neutral-600">{error ?? 'This reset link is invalid or has expired.'} Request a new one to continue.</p>
              <Link to="/forgot-password" className="btn-primary w-full !py-3 block">Send a new link</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              <div>
                <label className="label" htmlFor="new-password">New password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input id="new-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10" placeholder="At least 8 characters" autoComplete="new-password" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="confirm-password">Confirm new password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input id="confirm-password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="input pl-10" placeholder="Re-enter your new password" autoComplete="new-password" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full !py-3">
                {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
