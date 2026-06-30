-- Arregla los buckets de imágenes de entidades.
-- Ejecutar en Supabase > SQL Editor.
--
-- Motivo: el editor de imágenes sube SIEMPRE WebP. Si un bucket se creó
-- privado o con allowed_mime_types restringido (p. ej. desde la UI de Supabase
-- o con un script antiguo que usaba ON CONFLICT DO NOTHING), la subida falla
-- ("mime type image/webp is not supported") o la imagen no se ve (403 si es
-- privado). Esto fuerza public=true y WebP permitido, creando los que falten.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('group-images',     'group-images',     true, 4194304, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('community-images', 'community-images', true, 4194304, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('org-logos',        'org-logos',        true, 4194304, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars',          'avatars',          true, 4194304, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública para los tres buckets (idempotente)
DROP POLICY IF EXISTS "Leer group-images" ON storage.objects;
CREATE POLICY "Leer group-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'group-images');

DROP POLICY IF EXISTS "Leer community-images" ON storage.objects;
CREATE POLICY "Leer community-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS "Leer org-logos" ON storage.objects;
CREATE POLICY "Leer org-logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'org-logos');
