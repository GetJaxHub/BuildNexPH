import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/** Signed-in password change. Supabase checks the current password (Auth setting "Require current password"). */
export default function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!current) return setError('Enter your current password.');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('The new passwords do not match.');
    if (next === current) return setError('Choose a password different from your current one.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: next, current_password: current });
    setBusy(false);
    if (err) {
      setError(/current password/i.test(err.message) ? 'Your current password is incorrect.' : err.message);
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <KeyRound size={20} className="text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900">Change Password</h3>
          <p className="text-sm text-neutral-500 mt-0.5">Enter your current password, then a new one of at least 8 characters.</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="pw-current">Current password</label>
        <input id="pw-current" type="password" className="input" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pw-new">New password</label>
        <input id="pw-new" type="password" className="input" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pw-confirm">Confirm new password</label>
        <input id="pw-confirm" type="password" className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {done && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700" role="status">
          <CheckCircle2 size={16} /> Password changed.
        </div>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
        {busy ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
      </button>
    </form>
  );
}
