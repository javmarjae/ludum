-- Lista de deseos: añade columna in_wishlist a user_games
-- Ejecutar en Supabase > SQL Editor

ALTER TABLE user_games
  ADD COLUMN IF NOT EXISTS in_wishlist BOOLEAN NOT NULL DEFAULT false;

-- Índice para consultas de wishlist
CREATE INDEX IF NOT EXISTS user_games_wishlist_idx
  ON user_games(profile_id, in_wishlist);
