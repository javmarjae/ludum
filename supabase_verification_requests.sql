-- ── Solicitudes de verificación de perfil ────────────────────────────────────
-- Un usuario puede tener una sola solicitud activa.
-- Si es rechazada puede reenviarla actualizando el mismo registro.

CREATE TABLE IF NOT EXISTS verification_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason       TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'otro'
                 CHECK (category IN (
                   'creador_contenido', 'periodista', 'disenador',
                   'tienda', 'asociacion', 'organizador', 'otro'
                 )),
  social_links JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  admin_notes  TEXT,
  reviewed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ,
  CONSTRAINT one_request_per_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status
  ON verification_requests(status);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Usuarios ven y gestionan solo su propia solicitud
CREATE POLICY "Users see own request" ON verification_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own request" ON verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending request" ON verification_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'rechazada');

-- Admins tienen acceso total (vía service role desde admin actions)
