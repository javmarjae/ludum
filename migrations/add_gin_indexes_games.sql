-- GIN indexes for array overlap queries on games table
-- Needed for /juegos/[id] similar games query (.overlaps on mechanics/categories)
CREATE INDEX IF NOT EXISTS idx_games_mechanics_gin ON games USING gin(mechanics);
CREATE INDEX IF NOT EXISTS idx_games_categories_gin ON games USING gin(categories);
