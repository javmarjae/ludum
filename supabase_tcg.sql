-- Schema base para TCG (Magic, Pokémon, Yu-Gi-Oh, etc.)
--
-- Decisiones de diseño:
-- 1. Tablas SEPARADAS de la tabla games (que es BGG-céntrica con bgg_id NOT NULL).
--    Los juegos de mesa y las cartas TCG son entidades distintas con campos distintos.
--    Mezclarlos en una sola tabla con muchos NULLs sería un error.
--
-- 2. La tabla plays NO se toca. Las partidas de juegos de mesa y las partidas TCG
--    (duelos, torneos) son conceptos distintos. Habrá una tabla tcg_matches en el futuro.
--
-- 3. Los precios NO se almacenan aquí. El comparador de precios es una capa de
--    integración con APIs externas (Cardmarket, TCGPlayer, Pokémon TCG API, Scryfall)
--    que se consultará en tiempo real o con caché corta. No tiene sentido almacenar
--    precios en nuestra BD.
--
-- Ejecutar en Supabase > SQL Editor

-- ─── Juegos TCG disponibles en la plataforma ─────────────────────────────────
-- Catálogo de los juegos de cartas soportados
CREATE TABLE IF NOT EXISTS tcg_games (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,       -- 'Magic: The Gathering'
  short_name TEXT NOT NULL UNIQUE,       -- 'mtg' | 'pokemon' | 'yugioh'
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO tcg_games (name, short_name) VALUES
  ('Magic: The Gathering', 'mtg'),
  ('Pokémon TCG',          'pokemon'),
  ('Yu-Gi-Oh!',            'yugioh')
ON CONFLICT (short_name) DO NOTHING;


-- ─── Sets / Expansiones ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tcg_sets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg_game_id  UUID NOT NULL REFERENCES tcg_games(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,       -- 'Base Set', 'Innistrad: Midnight Hunt'
  code         TEXT,                -- 'BS', 'MID' — código oficial del set
  released_at  DATE,
  total_cards  INTEGER,
  image_url    TEXT,                -- logo/imagen del set
  external_id  TEXT,               -- ID en Scryfall / TCGPlayer / Pokémon API
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tcg_game_id, code)
);

CREATE INDEX IF NOT EXISTS tcg_sets_tcg_game_id_idx ON tcg_sets(tcg_game_id);
CREATE INDEX IF NOT EXISTS tcg_sets_code_idx         ON tcg_sets(tcg_game_id, code);


-- ─── Cartas ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tcg_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg_set_id      UUID NOT NULL REFERENCES tcg_sets(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  card_number     TEXT,             -- '001/102', 'MH2-001'
  rarity          TEXT,             -- 'common' | 'uncommon' | 'rare' | 'holo_rare' | 'mythic' | 'secret_rare' ...
  image_url       TEXT,
  image_back_url  TEXT,             -- cartas de doble cara (Magic transform, VSTAR Pokémon)
  external_id     TEXT UNIQUE,      -- Scryfall UUID / TCGPlayer product ID / Pokémon TCG API ID
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tcg_cards_tcg_set_id_idx  ON tcg_cards(tcg_set_id);
CREATE INDEX IF NOT EXISTS tcg_cards_name_idx         ON tcg_cards(name);
CREATE INDEX IF NOT EXISTS tcg_cards_external_id_idx  ON tcg_cards(external_id) WHERE external_id IS NOT NULL;


-- ─── Colección TCG del usuario ────────────────────────────────────────────────
-- Cada fila = un lote de copias de una carta con condición y variante específicas
-- (misma carta Near Mint y Lightly Played son filas distintas)
CREATE TABLE IF NOT EXISTS user_tcg_collection (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id     UUID NOT NULL REFERENCES tcg_cards(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition   TEXT NOT NULL DEFAULT 'near_mint',
              -- 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged'
  is_foil     BOOLEAN NOT NULL DEFAULT FALSE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, card_id, condition, is_foil)
);

CREATE INDEX IF NOT EXISTS user_tcg_collection_profile_id_idx ON user_tcg_collection(profile_id);
CREATE INDEX IF NOT EXISTS user_tcg_collection_card_id_idx    ON user_tcg_collection(card_id);

ALTER TABLE user_tcg_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_games            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_sets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_cards            ENABLE ROW LEVEL SECURITY;

-- TCG catalog: lectura pública (como la tabla games)
CREATE POLICY "TCG games visibles" ON tcg_games FOR SELECT USING (true);
CREATE POLICY "TCG sets visibles"  ON tcg_sets  FOR SELECT USING (true);
CREATE POLICY "TCG cards visibles" ON tcg_cards FOR SELECT USING (true);

-- Colección: misma lógica que user_games — visible para el dueño y sus seguidores
CREATE POLICY "Ver colección TCG propia o de seguidos" ON user_tcg_collection
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth.uid() AND following_id = user_tcg_collection.profile_id
    )
  );

CREATE POLICY "Añadir a colección TCG propia" ON user_tcg_collection
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Actualizar colección TCG propia" ON user_tcg_collection
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Quitar de colección TCG propia" ON user_tcg_collection
  FOR DELETE USING (profile_id = auth.uid());
