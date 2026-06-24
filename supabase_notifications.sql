-- Sistema de notificaciones
-- Ejecutar en Supabase > SQL Editor

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('new_follower', 'new_play_in_group')),
  reference_id UUID,   -- play_id | group_id según el tipo
  read         BOOLEAN DEFAULT FALSE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx  ON notifications(user_id) WHERE read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver propias notificaciones" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Marcar como leida" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los triggers SECURITY DEFINER pueden insertar sin restricción de usuario
CREATE POLICY "Insertar via trigger" ON notifications
  FOR INSERT WITH CHECK (true);

-- Activar Realtime para que el cliente reciba cambios en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── Trigger: nuevo seguidor ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'new_follower');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_follow ON follows;
CREATE TRIGGER on_new_follow
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- ── Trigger: nueva partida en grupo ─────────────────────────────────────
-- Notifica a todos los miembros del grupo salvo quien la registró

CREATE OR REPLACE FUNCTION notify_new_play_in_group()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, reference_id)
  SELECT
    gm.profile_id,
    NEW.created_by,
    'new_play_in_group',
    NEW.id
  FROM group_members gm
  WHERE gm.group_id = NEW.group_id
    AND gm.profile_id IS DISTINCT FROM NEW.created_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_play ON plays;
CREATE TRIGGER on_new_play
  AFTER INSERT ON plays
  FOR EACH ROW EXECUTE FUNCTION notify_new_play_in_group();
