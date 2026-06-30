-- Imágenes de eventos (banner)
-- Ejecutar en Supabase > SQL Editor
--
-- ⚠️ REQUISITO: ejecuta ANTES `supabase_events.sql` (crea la tabla `events`).
--    Las políticas de abajo consultan `events.created_by`, así que esa tabla
--    debe existir o fallará con: relation "events" does not exist.

-- Bucket público para imágenes de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'event-images',
    'event-images',
    true,
    4194304,  -- 4 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 4194304,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Solo el creador del evento puede subir/actualizar/borrar la imagen (carpeta {eventId}/...)
DROP POLICY IF EXISTS "Subir imagen de evento si eres creador" ON storage.objects;
CREATE POLICY "Subir imagen de evento si eres creador" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    auth.uid() = (
      SELECT created_by FROM events WHERE id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Actualizar imagen de evento si eres creador" ON storage.objects;
CREATE POLICY "Actualizar imagen de evento si eres creador" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-images' AND
    auth.uid() = (
      SELECT created_by FROM events WHERE id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Leer imágenes de evento públicamente" ON storage.objects;
CREATE POLICY "Leer imágenes de evento públicamente" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Borrar imagen de evento si eres creador" ON storage.objects;
CREATE POLICY "Borrar imagen de evento si eres creador" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' AND
    auth.uid() = (
      SELECT created_by FROM events WHERE id::text = (storage.foldername(name))[1]
    )
  );
