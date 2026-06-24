-- Bucket de avatares de usuario
-- Ejecutar en Supabase > SQL Editor

-- Crear bucket público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Cualquiera puede leer avatares (son públicos)
DROP POLICY IF EXISTS "Avatars publicos" ON storage.objects;
CREATE POLICY "Avatars publicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Cada usuario solo puede subir/actualizar dentro de su propia carpeta (userId/avatar.ext)
DROP POLICY IF EXISTS "Subir propio avatar" ON storage.objects;
CREATE POLICY "Subir propio avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Actualizar propio avatar" ON storage.objects;
CREATE POLICY "Actualizar propio avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Eliminar propio avatar" ON storage.objects;
CREATE POLICY "Eliminar propio avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
