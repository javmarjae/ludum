-- Añadir maps_url a organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- Añadir location y maps_url a communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- Bucket para imágenes de comunidades (ejecutar en Supabase dashboard si no existe)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true) ON CONFLICT DO NOTHING;

-- Política de acceso para community-images
-- CREATE POLICY "Public read community images" ON storage.objects FOR SELECT USING (bucket_id = 'community-images');
-- CREATE POLICY "Auth users upload community images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Auth users update community images" ON storage.objects FOR UPDATE USING (bucket_id = 'community-images' AND auth.role() = 'authenticated');
