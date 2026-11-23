/*
# Buyer ↔ contractor messaging

Plain English: a buyer can start a conversation with a contractor (optionally about one product), and
both sides can exchange text messages. Only the two people in a conversation can read it. New messages
arrive live through Supabase Realtime.

1. Tables
- `conversations`: one per buyer + contractor pair. Keeps the buyer's display name (contractors can't
  read buyer profiles), the product it started from, the last message preview, and per-side read times.
- `messages`: text messages, 1 to 2000 characters.

2. Security
- Row level security: a row is visible only to the buyer (buyer_user_id) or the contractor's owner.
- Only accounts tagged account_type = 'buyer' can start a conversation, and only as themselves.
- Messages can only be sent as yourself into a conversation you belong to. Nobody can edit or delete
  messages from the app.
- `mark_conversation_read()` updates only the caller's own read time.

3. Realtime: `messages` and `conversations` are added to the supabase_realtime publication.

Does not depend on the buyers table migration.
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  buyer_name text NOT NULL DEFAULT '' CHECK (char_length(buyer_name) <= 200),
  buyer_company text NOT NULL DEFAULT '' CHECK (char_length(buyer_company) <= 200),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  last_message text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_sender_id uuid,
  buyer_read_at timestamptz NOT NULL DEFAULT now(),
  contractor_read_at timestamptz NOT NULL DEFAULT 'epoch',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_user_id, contractor_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_contractor_idx ON conversations (contractor_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_buyer_idx ON conversations (buyer_user_id, last_message_at DESC);

-- True when the signed-in user is the buyer or owns the contractor in this conversation.
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations cv
    LEFT JOIN contractors ct ON ct.id = cv.contractor_id
    WHERE cv.id = conv_id
      AND (cv.buyer_user_id = auth.uid() OR ct.user_id = auth.uid())
  );
$$;
REVOKE EXECUTE ON FUNCTION is_conversation_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_conversation_member(uuid) TO authenticated;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read conversations" ON conversations FOR SELECT TO authenticated
  USING (is_conversation_member(id));

CREATE POLICY "Buyers start conversations" ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    buyer_user_id = auth.uid()
    AND coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') = 'buyer'
  );

CREATE POLICY "Members read messages" ON messages FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id));

CREATE POLICY "Members send messages as themselves" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_conversation_member(conversation_id));

-- Keep the conversation preview current; written by the server, not the app.
CREATE OR REPLACE FUNCTION touch_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
     SET last_message = left(NEW.body, 200),
         last_message_at = NEW.created_at,
         last_sender_id = NEW.sender_id,
         buyer_read_at = CASE WHEN buyer_user_id = NEW.sender_id THEN NEW.created_at ELSE buyer_read_at END,
         contractor_read_at = CASE WHEN buyer_user_id <> NEW.sender_id THEN NEW.created_at ELSE contractor_read_at END
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION touch_conversation_on_message() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION touch_conversation_on_message();

-- Marks a conversation read for whichever side the caller is.
CREATE OR REPLACE FUNCTION mark_conversation_read(conv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_conversation_member(conv_id) THEN
    RAISE EXCEPTION 'not a member of this conversation';
  END IF;
  UPDATE conversations
     SET buyer_read_at = CASE WHEN buyer_user_id = auth.uid() THEN now() ELSE buyer_read_at END,
         contractor_read_at = CASE WHEN buyer_user_id <> auth.uid() THEN now() ELSE contractor_read_at END
   WHERE id = conv_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mark_conversation_read(uuid) TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
