-- Expansiones: añadir is_expansion y parent_bgg_id a games
-- Ejecutar en Supabase > SQL Editor

ALTER TABLE games ADD COLUMN IF NOT EXISTS is_expansion BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS parent_bgg_id INTEGER;

-- Índice para búsquedas de expansiones por juego padre
CREATE INDEX IF NOT EXISTS games_parent_bgg_id_idx ON games(parent_bgg_id) WHERE parent_bgg_id IS NOT NULL;
