import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ResendConfirmation from '@/components/auth/ResendConfirmation';
import RoleSwitch from '@/components/auth/RoleSwitch';
import type { AccountType } from '@/lib/buyer';

const copy = {
  contractor: { sub: 'Manage your company profile, products, projects, licenses and buyer messages', register: 'Register your company', placeholder: 'company@email.com' },
  buyer: { sub: 'Message verified contractors and suppliers, and keep your details on file', register: 'Create a buyer account', placeholder: 'you@email.com' },
};

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<AccountType>(params.get('as') === 'buyer' ? 'buyer' : 'contractor');
  const t = copy[role];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnconfirmed(false);
    setLoading(true);
    const result = await signIn(email, password, role);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setUnconfirmed(result.unconfirmed);
    } else {
      navigate(params.get('next') || (role === 'buyer' ? '/account' : '/dashboard'));
    }
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
          <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
          <p className="text-neutral-500 mt-1 text-sm">{t.sub}</p>
        </div>

        <div className="mb-4">
          <RoleSwitch value={role} onChange={(r) => { setRole(r); setError(null); setUnconfirmed(false); }} />
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 animate-slide-down">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {unconfirmed && <div className="mb-4"><ResendConfirmation email={email} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder={t.placeholder}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : role === 'buyer' ? 'Sign In as Buyer' : 'Sign In as Contractor'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-5">
            Don't have an account?{' '}
            <Link to={`/signup?as=${role}`} className="text-primary-600 font-semibold hover:text-primary-700">
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
