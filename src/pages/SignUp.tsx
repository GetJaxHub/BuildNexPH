import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, User, Phone, Building2, MailCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ResendConfirmation from '@/components/auth/ResendConfirmation';
import { philippineRegions } from '@/lib/utils';
import RoleSwitch from '@/components/auth/RoleSwitch';
import BuyerForm from '@/components/auth/BuyerForm';
import { cleanBuyer, emptyBuyer, validateBuyer, type AccountType } from '@/lib/buyer';

export default function SignUp() {
  const { signUp, signUpBuyer } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<AccountType>(params.get('as') === 'buyer' ? 'buyer' : 'contractor');
  const [buyer, setBuyer] = useState(emptyBuyer);
  const [step, setStep] = useState(1);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [pcabLicense, setPcabLicense] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }
    const buyerError = role === 'buyer' ? validateBuyer(buyer) : null;
    if (buyerError) {
      setError(buyerError);
      return;
    }
    setLoading(true);

    const { error: signUpError, needsConfirmation } = role === 'buyer'
      ? await signUpBuyer(email, password, cleanBuyer(buyer))
      : await signUp(email, password, {
        company_name: companyName,
        contact_person: contactPerson,
        phone,
        region,
        address,
        pcab_license_no: pcabLicense,
      });
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsConfirmation) {
      setPendingEmail(email);
      return;
    }
    navigate(role === 'buyer' ? '/account' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/image.png" alt="BuildNexPH" className="w-12 h-12 rounded-xl object-cover" />
            <span className="font-display font-extrabold text-2xl text-neutral-900">
              BuildNex<span className="text-primary-600">PH</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">{role === 'buyer' ? 'Create a Buyer Account' : 'Register Your Company'}</h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Step {step} of 2 — {step === 1 ? 'Account credentials' : role === 'buyer' ? 'Your details' : 'Company details'}
          </p>
        </div>

        {!pendingEmail && (
          <div className="mb-4">
            <RoleSwitch value={role} onChange={(r) => { setRole(r); setError(null); }} />
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-neutral-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-neutral-200'}`} />
        </div>

        {pendingEmail ? (
          <div className="card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto">
              <MailCheck size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Check your inbox</h2>
            <p className="text-sm text-neutral-500">
              We sent a confirmation link to <span className="font-semibold text-neutral-900">{pendingEmail}</span>.
              Click the link to activate your account, then sign in to continue your company registration.
            </p>
            <ResendConfirmation email={pendingEmail} />
            <Link to="/signin" className="btn-primary w-full !py-3 block">
              Go to sign in
            </Link>
          </div>
        ) : (
        <div className="card p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 animate-slide-down">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
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
                    placeholder="company@email.com"
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
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full !py-3">
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {role === 'buyer' ? <BuyerForm value={buyer} onChange={setBuyer} /> : (<>
              <div>
                <label className="label">Company Name</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input pl-10"
                    placeholder="e.g. BuildRight Construction Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Person</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="input pl-10"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input pl-10"
                      placeholder="+63 917 123 4567"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Region</label>
                <select
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input"
                >
                  <option value="">Select your region</option>
                  {philippineRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Business Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  placeholder="Street, City, Province"
                />
              </div>

              <div>
                <label className="label">PCAB License Number (optional)</label>
                <input
                  type="text"
                  value={pcabLicense}
                  onChange={(e) => setPcabLicense(e.target.value)}
                  className="input"
                  placeholder="e.g. AAA-12345-CON"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Philippine Contractors Accreditation Board license number, if available.
                </p>
              </div>
              </>)}

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="agreeTerms" className="text-xs text-neutral-500 leading-relaxed">
                  I have read and agree to the{' '}
                  <Link to="/terms-of-service" className="text-primary-600 font-semibold hover:underline" target="_blank">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="text-primary-600 font-semibold hover:underline" target="_blank">Privacy Policy</Link>.
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>
        )}

        <p className="text-center text-sm text-neutral-500 mt-5">
          Already have an account?{' '}
          <Link to={`/signin?as=${role}`} className="text-primary-600 font-semibold hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
