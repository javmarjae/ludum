-- Colección personal de juegos por usuario
-- Ejecutar en Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS user_games (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, game_id)
);

CREATE INDEX IF NOT EXISTS user_games_profile_id_idx ON user_games(profile_id);

ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver propia colección" ON user_games
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Añadir a propia colección" ON user_games
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Quitar de propia colección" ON user_games
  FOR DELETE USING (profile_id = auth.uid());
