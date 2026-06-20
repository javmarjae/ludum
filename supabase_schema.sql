-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table (synced from BGG)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  year_published INTEGER,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  min_playtime INTEGER,
  max_playtime INTEGER,
  complexity NUMERIC, -- BGG "weight" 1-5
  bgg_rank INTEGER,
  bgg_rating NUMERIC,
  description TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mechanics catalog
CREATE TABLE mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game mechanics junction table (N:N)
CREATE TABLE game_mechanics (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  mechanic_id UUID REFERENCES mechanics(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, mechanic_id)
);

-- Categories catalog
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game categories junction table (N:N)
CREATE TABLE game_categories (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, category_id)
);

-- User profiles (extended from auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members junction table (N:N)
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, profile_id)
);

-- Group games collection (what games each group has)
CREATE TABLE group_games (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, game_id)
);

-- Plays (recorded matches)
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  played_at DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play results (player scores per play)
CREATE TABLE play_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  guest_name TEXT, -- for players without accounts
  score NUMERIC,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_games_bgg_id ON games(bgg_id);
CREATE INDEX idx_games_bgg_rank ON games(bgg_rank);
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_profile_id ON group_members(profile_id);
CREATE INDEX idx_plays_group_id ON plays(group_id);
CREATE INDEX idx_plays_game_id ON plays(game_id);
CREATE INDEX idx_play_results_play_id ON play_results(play_id);
CREATE INDEX idx_play_results_profile_id ON play_results(profile_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles (users can only read their own)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Groups (members can view group details)
CREATE POLICY "Group members can view group details" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.profile_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

-- RLS Policies: Group Members (transparent read)
CREATE POLICY "Anyone can view group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND (
        EXISTS (
          SELECT 1 FROM group_members gm2
          WHERE gm2.group_id = groups.id
          AND gm2.profile_id = auth.uid()
        ) OR groups.owner_id = auth.uid()
      )
    )
  );

-- RLS Policies: Plays (group members can see group plays)
CREATE POLICY "Group members can view plays" ON plays
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = plays.group_id
      AND group_members.profile_id = auth.uid()
    )
  );

-- Public access to games table (no RLS needed for read-only)
CREATE POLICY "Games are public" ON games FOR SELECT USING (true);
CREATE POLICY "Mechanics are public" ON mechanics FOR SELECT USING (true);
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);
CREATE POLICY "Game mechanics are public" ON game_mechanics FOR SELECT USING (true);
CREATE POLICY "Game categories are public" ON game_categories FOR SELECT USING (true);
