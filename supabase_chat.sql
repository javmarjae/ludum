-- Sistema de chat entre usuarios
-- Ejecutar en Supabase > SQL Editor

-- ── Conversaciones ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT conversations_unique  UNIQUE (user1_id, user2_id),
  CONSTRAINT conversations_ordered CHECK  (user1_id < user2_id)
);

CREATE INDEX IF NOT EXISTS conversations_user1_idx ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS conversations_user2_idx ON conversations(user2_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver propias conversaciones" ON conversations
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Crear conversacion" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- ── Mensajes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(trim(content)) > 0),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conv_created_idx ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS messages_unread_idx       ON messages(conversation_id) WHERE read_at IS NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mensajes de tu conversacion" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user1_id, c.user2_id)
    )
  );

CREATE POLICY "Enviar mensajes" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user1_id, c.user2_id)
    )
  );

CREATE POLICY "Marcar como leido" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user1_id, c.user2_id)
        AND auth.uid() != messages.sender_id
    )
  );

-- Activar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ── Helper: obtener o crear conversación (orden canónico) ─────────────────
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  me      UUID := auth.uid();
  u1      UUID;
  u2      UUID;
  conv_id UUID;
BEGIN
  IF me < other_user_id THEN u1 := me;           u2 := other_user_id;
  ELSE                        u1 := other_user_id; u2 := me;
  END IF;

  INSERT INTO conversations (user1_id, user2_id)
  VALUES (u1, u2)
  ON CONFLICT (user1_id, user2_id) DO NOTHING;

  SELECT id INTO conv_id
  FROM conversations
  WHERE user1_id = u1 AND user2_id = u2;

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID) TO authenticated;

-- ── Helper: lista de conversaciones con último mensaje y no leídos ────────
CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
  id                    UUID,
  other_user_id         UUID,
  other_user_name       TEXT,
  other_user_avatar     TEXT,
  last_message_content  TEXT,
  last_message_at       TIMESTAMPTZ,
  last_message_sender   UUID,
  unread_count          BIGINT
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    c.id,
    CASE WHEN c.user1_id = auth.uid() THEN c.user2_id ELSE c.user1_id END AS other_user_id,
    p.display_name                                                          AS other_user_name,
    (p.avatar_url)::TEXT                                                    AS other_user_avatar,
    lm.content                                                              AS last_message_content,
    lm.created_at                                                           AS last_message_at,
    lm.sender_id                                                            AS last_message_sender,
    COALESCE((
      SELECT COUNT(*) FROM messages m2
      WHERE m2.conversation_id = c.id
        AND m2.sender_id != auth.uid()
        AND m2.read_at IS NULL
    ), 0)                                                                   AS unread_count
  FROM conversations c
  JOIN profiles p ON p.id = CASE WHEN c.user1_id = auth.uid() THEN c.user2_id ELSE c.user1_id END
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE auth.uid() IN (c.user1_id, c.user2_id)
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_my_conversations() TO authenticated;

-- ── Helper: total de mensajes no leídos en todas mis conversaciones ───────
CREATE OR REPLACE FUNCTION get_total_unread_messages()
RETURNS BIGINT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(COUNT(*), 0)
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    AND m.sender_id != auth.uid()
    AND m.read_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION get_total_unread_messages() TO authenticated;

-- ── Notificación de nuevo mensaje ─────────────────────────────────────────
-- Añadir el tipo 'new_message' a la tabla de notificaciones si ya existe
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_follower', 'new_play_in_group', 'new_message'));

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  recipient UUID;
BEGIN
  SELECT CASE WHEN c.user1_id = NEW.sender_id THEN c.user2_id ELSE c.user1_id END
  INTO recipient
  FROM conversations c WHERE c.id = NEW.conversation_id;

  INSERT INTO notifications (user_id, actor_id, type, reference_id)
  VALUES (recipient, NEW.sender_id, 'new_message', NEW.conversation_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();
