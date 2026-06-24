-- Sistema de seguimiento entre usuarios (follows asimétrico)
-- Decisión: follow asimétrico (como Twitter) en lugar de amistad simétrica (como Facebook).
-- Razón: permite seguir a alguien sin reciprocidad, ideal para descubrir perfiles públicos
-- y contenido de jugadores que no conoces. Dos follows mutuos = "amigos" en la UI sin
-- cambiar el schema.
-- Ejecutar en Supabase > SQL Editor

-- Tabla de follows
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)  -- no auto-follow
);

CREATE INDEX IF NOT EXISTS follows_follower_id_idx  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver quién sigue a quién (necesario para perfiles públicos)
CREATE POLICY "Ver follows públicos" ON follows
  FOR SELECT USING (true);

-- Solo puedes seguir tú mismo
CREATE POLICY "Seguir como tú mismo" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Solo puedes dejar de seguir si eres el follower
CREATE POLICY "Dejar de seguir como tú mismo" ON follows
  FOR DELETE USING (auth.uid() = follower_id);


-- Colecciones: permitir ver la colección de otros usuarios
-- (actualmente solo visible para el propio usuario — hay que ampliar la policy)
DROP POLICY IF EXISTS "Ver propia colección" ON user_games;

CREATE POLICY "Ver colección propia o de seguidos" ON user_games
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth.uid() AND following_id = user_games.profile_id
    )
  );


-- Función helper: devuelve si el usuario actual sigue a otro perfil
CREATE OR REPLACE FUNCTION is_following(target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = auth.uid() AND following_id = target_profile_id
  );
$$;

GRANT EXECUTE ON FUNCTION is_following(UUID) TO authenticated;


-- Función helper: stats de un perfil (seguidores, seguidos)
-- Útil para no hacer dos queries en la página de perfil público
CREATE OR REPLACE FUNCTION get_profile_follow_stats(target_profile_id UUID)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'followers_count', (SELECT COUNT(*) FROM follows WHERE following_id = target_profile_id),
    'following_count', (SELECT COUNT(*) FROM follows WHERE follower_id  = target_profile_id),
    'is_following',    (SELECT EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = target_profile_id))
  );
$$;

GRANT EXECUTE ON FUNCTION get_profile_follow_stats(UUID) TO authenticated;
