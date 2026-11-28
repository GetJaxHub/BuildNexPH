import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Turnstile, { captchaEnabled } from '@/components/auth/Turnstile';

interface ResendConfirmationProps {
  email: string;
}

export default function ResendConfirmation({ email }: ResendConfirmationProps) {
  const { resendConfirmation } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const handleResend = async () => {
    setStatus('sending');
    setErrorMessage(null);
    const { error } = await resendConfirmation(email, captcha ?? undefined);
    setCaptchaReset((k) => k + 1);
    if (error) {
      setStatus('error');
      setErrorMessage(error);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="space-y-2">
      <Turnstile onToken={setCaptcha} resetKey={captchaReset} />
      <button
        type="button"
        onClick={handleResend}
        disabled={status === 'sending' || !email || (captchaEnabled && !captcha)}
        className="btn-secondary w-full !py-3"
      >
        {status === 'sending' ? <Loader2 size={18} className="animate-spin" /> : 'Resend confirmation email'}
      </button>
      {status === 'sent' && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-success-700">
          <CheckCircle2 size={16} /> A new confirmation email is on its way.
        </p>
      )}
      {status === 'error' && errorMessage && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-error-700">
          <AlertCircle size={16} /> {errorMessage}
        </p>
      )}
    </div>
  );
}
