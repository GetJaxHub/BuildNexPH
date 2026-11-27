import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2, MessageSquare, Send, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getConversation, inboxKey, isUnread, listConversations, loadMessages, markRead, otherParty, sendMessage, timeLabel,
  type Conversation, type Message,
} from '@/lib/messaging';

/** Inbox + chat. Two panes on desktop; on phones the list and the chat are separate screens (/messages, /messages/:id). */
export default function Messages() {
  const { id } = useParams<{ id: string }>();
  const { user, accountType, contractor, loading } = useAuth();
  const me = user?.id ?? '';
  const key = inboxKey(accountType, me, contractor?.id);
  const keyCol = key?.column;
  const keyVal = key?.value;
  const [items, setItems] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const load = useCallback(async () => {
    if (!keyCol || !keyVal) { setItems([]); setListLoading(false); return; }
    const res = await listConversations({ column: keyCol, value: keyVal });
    setItems(res.data);
    setError(res.error);
    setListLoading(false);
  }, [keyCol, keyVal]);

  useEffect(() => { load(); }, [load, id]);

  useEffect(() => {
    if (!keyCol || !keyVal) return;
    const ch = supabase.channel(`inbox-web-${keyVal}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `${keyCol}=eq.${keyVal}` }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [keyCol, keyVal, load]);

  if (loading) return <Center><Loader2 size={32} className="animate-spin text-primary-600" /></Center>;
  if (!user) return <Navigate to="/signin?next=/messages" replace />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className={`text-2xl font-bold text-neutral-900 mb-4 ${id ? 'hidden md:block' : ''}`}>Messages</h1>
      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-4 md:h-[calc(100vh-180px)] md:min-h-[480px]">
        <aside className={`${id ? 'hidden md:block' : ''} md:overflow-y-auto space-y-2`}>
          {error && <div className="card p-4 text-sm text-neutral-600">{error}</div>}
          {listLoading ? <Center><Loader2 size={24} className="animate-spin text-primary-600" /></Center>
            : !error && items.length === 0 ? (
              <div className="card p-6 text-center text-sm text-neutral-500">
                <MessageSquare size={32} className="text-neutral-300 mx-auto mb-2" />
                {accountType === 'buyer'
                  ? 'No messages yet. Open a contractor or product and click "Message" to start a conversation.'
                  : 'No messages yet. Buyers who contact your company will appear here.'}
              </div>
            ) : items.map((c) => {
              const unread = isUnread(c, me);
              return (
                <Link key={c.id} to={`/messages/${c.id}`}
                  className={`card p-3 flex items-center gap-3 transition-colors ${c.id === id ? 'border-primary-400 bg-primary-50' : 'hover:border-neutral-300'}`}>
                  <div className="w-11 h-11 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.buyer_user_id === me
                      ? (c.contractor?.logo_url ? <img src={c.contractor.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 size={20} />)
                      : <User size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`flex-1 truncate text-sm ${unread ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-800'}`}>{otherParty(c, me)}</p>
                      <span className={`text-xs ${unread ? 'text-primary-600' : 'text-neutral-400'}`}>{timeLabel(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`flex-1 truncate text-sm ${unread ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {c.last_message ? `${c.last_sender_id === me ? 'You: ' : ''}${c.last_message}` : 'New conversation'}
                      </p>
                      {unread && <span className="w-2.5 h-2.5 rounded-full bg-primary-600 flex-shrink-0" />}
                    </div>
                  </div>
                </Link>
              );
            })}
        </aside>
        <section className={`${id ? '' : 'hidden md:flex'} md:flex flex-col`}>
          {id ? <Chat key={id} id={id} me={me} /> : (
            <div className="card flex-1 flex items-center justify-center text-sm text-neutral-400">Select a conversation</div>
          )}
        </section>
      </div>
    </div>
  );
}

function Chat({ id, me }: { id: string; me: string }) {
  const navigate = useNavigate();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]); // oldest first
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const add = useCallback((m: Message) => setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m])), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, m] = await Promise.all([getConversation(id), loadMessages(id)]);
      if (!alive) return;
      setConv(c.data);
      setMsgs([...m.data].reverse());
      setError(c.error ?? m.error);
      setLoading(false);
      if (c.data) markRead(id);
    })();
    const ch = supabase.channel(`chat-web-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => { add(payload.new as Message); markRead(id); })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [id, add]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await sendMessage(id, me, body);
    setSending(false);
    if (res.error || !res.data) return setError(res.error ?? 'Message not sent. Try again.');
    setText('');
    add(res.data);
  };

  if (loading) return <Center><Loader2 size={24} className="animate-spin text-primary-600" /></Center>;

  const isBuyer = conv?.buyer_user_id === me;
  return (
    <div className="card flex-1 flex flex-col min-h-[70vh] md:min-h-0 overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200">
        <button onClick={() => navigate('/messages')} className="md:hidden p-1 -ml-1 rounded hover:bg-neutral-100" aria-label="Back to messages">
          <ArrowLeft size={18} />
        </button>
        <p className="font-semibold text-neutral-900 flex-1 truncate">{conv ? otherParty(conv, me) : 'Messages'}</p>
        {isBuyer && conv && <Link to={`/contractors/${conv.contractor_id}`} className="text-xs text-primary-600 font-semibold hover:text-primary-700">View profile</Link>}
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-50">
        {conv && msgs.length === 0 && (
          <p className="text-center text-sm text-neutral-500 py-10">
            {isBuyer ? 'Say hello and describe what you need: materials, quantities, location and timeline.' : 'No messages yet.'}
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words ${
                mine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-sm'}`}>
                {m.body}
              </div>
              <span className="text-[11px] text-neutral-400 mt-0.5">{timeLabel(m.created_at)}</span>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error && <p className="px-4 py-2 text-sm text-error-700 bg-error-50">{error}</p>}
      {conv && (
        <form onSubmit={send} className="flex items-end gap-2 p-3 border-t border-neutral-200 bg-white">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
            placeholder="Write a message..."
            aria-label="Message"
            maxLength={2000}
            rows={1}
            className="input flex-1 resize-none max-h-32"
          />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Send" className="btn-primary !p-3 rounded-full">
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[30vh] flex items-center justify-center">{children}</div>;
}
