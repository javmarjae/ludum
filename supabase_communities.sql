-- ── Comunidades ──────────────────────────────────────────────────────────────
-- Comunidades públicas organizadas por categorías de juegos de mesa

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_official BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, profile_id)
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_category_id ON communities(category_id);
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_profile_id ON community_members(profile_id);
CREATE INDEX idx_community_posts_community_id ON community_posts(community_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);

-- RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities public read" ON communities FOR SELECT USING (true);
CREATE POLICY "Authenticated can create community" ON communities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);
CREATE POLICY "Creator can update community" ON communities
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete community" ON communities
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Community members public read" ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can join" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can leave" ON community_members
  FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Posts public read" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Members can post" ON community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_posts.community_id AND profile_id = auth.uid()
    )
  );
CREATE POLICY "Author can delete post" ON community_posts
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments public read" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can delete comment" ON community_comments
  FOR DELETE USING (auth.uid() = author_id);

-- ── Seed: una comunidad oficial por cada categoría existente ──────────────────
-- translate() convierte acentos y espacios en slugs ASCII limpios
INSERT INTO communities (name, description, slug, category_id, is_official)
SELECT
  c.name,
  'Comunidad oficial de ' || c.name
    || '. Comparte partidas, posts y conecta con otros aficionados a este género.',
  lower(translate(
    c.name,
    'áàäéèëíìïóòöúùüñÁÀÄÉÈËÍÌÏÓÒÖÚÙÜÑ ',
    'aaaeeeiiiooouuunAAAEEEIIIOOOUUUN-'
  )),
  c.id,
  true
FROM categories c
ON CONFLICT (slug) DO NOTHING;
