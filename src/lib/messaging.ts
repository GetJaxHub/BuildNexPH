// Same as the mobile app (buildnex-mobile/src/lib/messaging.ts) — keep in sync.
import type { PostgrestError } from '@supabase/supabase-js';
import type { BuyerProfile } from './buyer';
import { supabase } from './supabase';

// Tables come from buildnex-web/supabase/migrations/20261123010000_buyer_contractor_messaging.sql.
export interface Conversation {
  id: string;
  buyer_user_id: string;
  contractor_id: string;
  buyer_name: string;
  buyer_company: string;
  product_id: string | null;
  last_message: string;
  last_message_at: string;
  last_sender_id: string | null;
  buyer_read_at: string;
  contractor_read_at: string;
  contractor?: { id: string; company_name: string; logo_url: string; user_id: string } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const NOT_SET_UP = 'Messaging is not switched on yet. It will work once the BuildNexPH database update is applied.';

/** The messaging tables don't exist until the migration runs; show a friendly note instead of a raw error. */
export const friendlyError = (e: PostgrestError | null): string | null =>
  !e ? null : e.code === '42P01' || e.code === 'PGRST205' ? NOT_SET_UP : e.message;

const CONV_SELECT = '*, contractor:contractors(id, company_name, logo_url, user_id)';

/**
 * Which column marks "my" conversations: buyers by their user id, contractors by their company id.
 * Filtering on it (instead of relying on the access rule alone) lets Postgres use the inbox indexes,
 * and limits live updates to this user's own threads. null = no inbox yet (contractor without a profile).
 */
export type InboxKey = { column: 'buyer_user_id' | 'contractor_id'; value: string };
export const inboxKey = (accountType: string | null, userId?: string, contractorId?: string | null): InboxKey | null =>
  accountType === 'buyer'
    ? (userId ? { column: 'buyer_user_id', value: userId } : null)
    : (contractorId ? { column: 'contractor_id', value: contractorId } : null);

export async function listConversations(key: InboxKey) {
  const { data, error } = await supabase.from('conversations').select(CONV_SELECT)
    .eq(key.column, key.value).order('last_message_at', { ascending: false }).limit(100);
  return { data: (data as Conversation[] | null) ?? [], error: friendlyError(error) };
}

export async function getConversation(id: string) {
  const { data, error } = await supabase.from('conversations').select(CONV_SELECT).eq('id', id).maybeSingle();
  return { data: data as Conversation | null, error: friendlyError(error) };
}

/** Get the buyer's existing thread with this contractor, or start one. */
export async function openConversation(buyerUserId: string, buyer: BuyerProfile, contractorId: string, productId?: string) {
  const existing = await supabase.from('conversations').select('id')
    .eq('buyer_user_id', buyerUserId).eq('contractor_id', contractorId).maybeSingle();
  if (existing.error) return { id: null, error: friendlyError(existing.error) };
  if (existing.data) return { id: existing.data.id as string, error: null };

  const { data, error } = await supabase.from('conversations').insert({
    buyer_user_id: buyerUserId,
    contractor_id: contractorId,
    product_id: productId ?? null,
    buyer_name: buyer.full_name.slice(0, 200),
    buyer_company: buyer.buyer_type === 'company' ? buyer.buyer_company_name.slice(0, 200) : '',
  }).select('id').single();
  return { id: (data?.id as string | undefined) ?? null, error: friendlyError(error) };
}

export async function loadMessages(conversationId: string) {
  const { data, error } = await supabase.from('messages').select('*')
    .eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(200);
  return { data: (data as Message[] | null) ?? [], error: friendlyError(error) };
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { data, error } = await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim().slice(0, 2000) })
    .select('*').single();
  return { data: data as Message | null, error: friendlyError(error) };
}

export async function markRead(conversationId: string) {
  await supabase.rpc('mark_conversation_read', { conv_id: conversationId });
}

/** Unread for me: someone else sent the last message after I last read the thread. */
export function isUnread(c: Conversation, myUserId: string) {
  if (!c.last_sender_id || c.last_sender_id === myUserId) return false;
  const readAt = c.buyer_user_id === myUserId ? c.buyer_read_at : c.contractor_read_at;
  return new Date(c.last_message_at) > new Date(readAt);
}

/** Name of the other party, from the viewer's side. */
export function otherParty(c: Conversation, myUserId: string) {
  if (c.buyer_user_id === myUserId) return c.contractor?.company_name ?? 'Contractor';
  return c.buyer_company ? `${c.buyer_name} · ${c.buyer_company}` : c.buyer_name || 'Buyer';
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
