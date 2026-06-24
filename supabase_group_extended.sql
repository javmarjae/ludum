-- Grupos extendidos: imagen y descripción
-- Ejecutar en Supabase > SQL Editor

ALTER TABLE groups ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT;

-- Bucket público para imágenes de grupos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('group-images', 'group-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Solo el owner del grupo puede subir/actualizar la imagen
CREATE POLICY "Subir imagen de grupo si eres owner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'group-images' AND
    auth.uid() = (
      SELECT owner_id FROM groups WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Actualizar imagen de grupo si eres owner" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'group-images' AND
    auth.uid() = (
      SELECT owner_id FROM groups WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Leer imágenes de grupo públicamente" ON storage.objects
  FOR SELECT USING (bucket_id = 'group-images');

CREATE POLICY "Borrar imagen de grupo si eres owner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'group-images' AND
    auth.uid() = (
      SELECT owner_id FROM groups WHERE id::text = (storage.foldername(name))[1]
    )
  );
