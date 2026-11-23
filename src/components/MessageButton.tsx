import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { openConversation } from '@/lib/messaging';

/** "Message" on contractor and product pages. Buyers chat; guests are sent to sign in; contractors don't see it. */
export default function MessageButton({ contractorId, productId, className = '' }: { contractorId: string; productId?: string; className?: string }) {
  const { user, accountType, buyer } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (accountType === 'contractor') return null;

  const onClick = async () => {
    if (!user || !buyer) {
      navigate(`/signin?as=buyer&next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await openConversation(user.id, buyer, contractorId, productId);
    setBusy(false);
    if (res.error || !res.id) return setError(res.error ?? 'Could not open the conversation. Try again.');
    navigate(`/messages/${res.id}`);
  };

  return (
    <div className={className}>
      <button type="button" onClick={onClick} disabled={busy} className="btn-primary w-full !py-2.5">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
        {user ? 'Message' : 'Sign in to message'}
      </button>
      {error && <p className="text-xs text-error-700 mt-2">{error}</p>}
    </div>
  );
}
