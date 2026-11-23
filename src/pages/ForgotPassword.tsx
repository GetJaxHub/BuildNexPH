import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Mail, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/** Step 1 of password reset: email a reset link (works for contractor and buyer accounts). */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    // Rate limits are worth showing; "no such user" is never reported by Supabase, so this doesn't leak accounts.
    if (err) return setError(err.message);
    setSent(true);
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
          <h1 className="text-2xl font-bold text-neutral-900">Forgot your password?</h1>
          <p className="text-neutral-500 mt-1 text-sm">Enter your email and we'll send you a link to choose a new one.</p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto">
                <MailCheck size={24} className="text-white" />
              </div>
              <p className="text-sm text-neutral-600">
                If an account exists for <span className="font-semibold text-neutral-900">{email}</span>, a reset link is on its way.
                Check your inbox and spam folder.
              </p>
              <Link to="/signin" className="btn-primary w-full !py-3 block">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              <div>
                <label className="label" htmlFor="reset-email">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10" placeholder="you@email.com" autoComplete="email" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-neutral-500">
                Remembered it? <Link to="/signin" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
