-- =====================================================
-- TORNEOS: Asociaciones y tiendas
-- =====================================================

-- 1. Organizations (asociaciones y tiendas)
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('asociacion', 'tienda')),
  description text,
  logo_url    text,
  location    text,
  website     text,
  verified    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Additional organizers (not the owner)
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer')),
  PRIMARY KEY (organization_id, profile_id)
);

-- 3. Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  game_id          uuid REFERENCES games ON DELETE SET NULL,
  name             text NOT NULL,
  description      text,
  format           text NOT NULL DEFAULT 'libre'
                   CHECK (format IN ('libre', 'round_robin', 'swiss', 'eliminacion')),
  status           text NOT NULL DEFAULT 'borrador'
                   CHECK (status IN ('borrador', 'inscripciones', 'en_curso', 'finalizado', 'cancelado')),
  max_participants integer,
  start_date       date,
  end_date         date,
  location         text,
  prize_info       text,
  is_public        boolean NOT NULL DEFAULT true,
  created_by       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 4. Participants (registered users or guests with just a name)
CREATE TABLE IF NOT EXISTS tournament_participants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid NOT NULL REFERENCES tournaments ON DELETE CASCADE,
  profile_id     uuid REFERENCES profiles ON DELETE SET NULL,
  guest_name     text,
  placement      integer,
  status         text NOT NULL DEFAULT 'activo'
                 CHECK (status IN ('activo', 'eliminado', 'retirado')),
  registered_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT participant_has_identity
    CHECK (profile_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_name <> ''))
);

-- 5. Rounds (optional grouping of matches)
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid NOT NULL REFERENCES tournaments ON DELETE CASCADE,
  round_number   integer NOT NULL,
  name           text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'en_curso'
                 CHECK (status IN ('pendiente', 'en_curso', 'completada')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round_number)
);

-- 6. Matches within rounds
CREATE TABLE IF NOT EXISTS tournament_matches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id     uuid NOT NULL REFERENCES tournament_rounds ON DELETE CASCADE,
  table_number integer,
  status       text NOT NULL DEFAULT 'pendiente'
               CHECK (status IN ('pendiente', 'completada')),
  notes        text,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 7. Per-participant match results
CREATE TABLE IF NOT EXISTS match_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       uuid NOT NULL REFERENCES tournament_matches ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES tournament_participants ON DELETE CASCADE,
  score          numeric,
  is_winner      boolean NOT NULL DEFAULT false,
  placement      integer,
  UNIQUE (match_id, participant_id)
);

-- =====================================================
-- Helper functions for RLS
-- =====================================================

CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations WHERE id = org_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND profile_id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION is_tournament_organizer(t_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tournaments
    WHERE id = t_id
      AND (created_by = auth.uid() OR is_org_admin(organization_id))
  )
$$;

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results           ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies: organizations
-- =====================================================

CREATE POLICY "org_select"  ON organizations FOR SELECT  USING (true);
CREATE POLICY "org_insert"  ON organizations FOR INSERT  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "org_update"  ON organizations FOR UPDATE  USING (is_org_admin(id));
CREATE POLICY "org_delete"  ON organizations FOR DELETE  USING (owner_id = auth.uid());

-- =====================================================
-- Policies: organization_members
-- =====================================================

CREATE POLICY "org_members_select" ON organization_members FOR SELECT USING (true);
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT
  WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE
  USING (is_org_admin(organization_id));

-- =====================================================
-- Policies: tournaments
-- =====================================================

CREATE POLICY "tournament_select" ON tournaments FOR SELECT
  USING (is_public = true OR is_tournament_organizer(id));
CREATE POLICY "tournament_insert" ON tournaments FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_org_admin(organization_id));
CREATE POLICY "tournament_update" ON tournaments FOR UPDATE
  USING (is_tournament_organizer(id));
CREATE POLICY "tournament_delete" ON tournaments FOR DELETE
  USING (is_tournament_organizer(id));

-- =====================================================
-- Policies: tournament_participants
-- =====================================================

CREATE POLICY "participants_select" ON tournament_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments
    WHERE id = tournament_id AND (is_public = true OR is_tournament_organizer(id))
  ));
CREATE POLICY "participants_insert" ON tournament_participants FOR INSERT
  WITH CHECK (is_tournament_organizer(tournament_id));
CREATE POLICY "participants_update" ON tournament_participants FOR UPDATE
  USING (is_tournament_organizer(tournament_id));
CREATE POLICY "participants_delete" ON tournament_participants FOR DELETE
  USING (is_tournament_organizer(tournament_id));

-- =====================================================
-- Policies: tournament_rounds
-- =====================================================

CREATE POLICY "rounds_select" ON tournament_rounds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments
    WHERE id = tournament_id AND (is_public = true OR is_tournament_organizer(id))
  ));
CREATE POLICY "rounds_insert" ON tournament_rounds FOR INSERT
  WITH CHECK (is_tournament_organizer(tournament_id));
CREATE POLICY "rounds_update" ON tournament_rounds FOR UPDATE
  USING (is_tournament_organizer(tournament_id));
CREATE POLICY "rounds_delete" ON tournament_rounds FOR DELETE
  USING (is_tournament_organizer(tournament_id));

-- =====================================================
-- Policies: tournament_matches
-- =====================================================

CREATE POLICY "matches_select" ON tournament_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournament_rounds r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.id = round_id AND (t.is_public = true OR is_tournament_organizer(t.id))
  ));
CREATE POLICY "matches_insert" ON tournament_matches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tournament_rounds r
    WHERE r.id = round_id AND is_tournament_organizer(r.tournament_id)
  ));
CREATE POLICY "matches_update" ON tournament_matches FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM tournament_rounds r
    WHERE r.id = round_id AND is_tournament_organizer(r.tournament_id)
  ));
CREATE POLICY "matches_delete" ON tournament_matches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tournament_rounds r
    WHERE r.id = round_id AND is_tournament_organizer(r.tournament_id)
  ));

-- =====================================================
-- Policies: match_results
-- =====================================================

CREATE POLICY "match_results_select" ON match_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournament_rounds r ON r.id = tm.round_id
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE tm.id = match_id AND (t.is_public = true OR is_tournament_organizer(t.id))
  ));
CREATE POLICY "match_results_insert" ON match_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournament_rounds r ON r.id = tm.round_id
    WHERE tm.id = match_id AND is_tournament_organizer(r.tournament_id)
  ));
CREATE POLICY "match_results_delete" ON match_results FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournament_rounds r ON r.id = tm.round_id
    WHERE tm.id = match_id AND is_tournament_organizer(r.tournament_id)
  ));
