-- Arregla la subida de imágenes de entidades (grupos, comunidades, organizaciones).
-- Ejecutar en Supabase > SQL Editor.
--
-- Síntoma: "new row violates row-level security policy" al subir la foto.
-- Causa: la política de storage comprobaba la propiedad con una subconsulta a
--   `groups`/`communities`/`organizations`, pero esa subconsulta queda sujeta a
--   la RLS de esas tablas y devuelve NULL en el contexto de storage → la
--   comprobación falla aunque seas el dueño. Además el editor sube WebP, así que
--   el bucket debe ser público y permitir image/webp.
-- Solución: (1) buckets públicos + WebP; (2) funciones SECURITY DEFINER que
--   comprueban la propiedad saltándose la RLS; (3) políticas de storage que las usan.
--   La propiedad/permiso real ya se valida también en el server action.

-- ── 1. Buckets: públicos + WebP permitido (crea los que falten) ───────────────
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

-- ── 2. Helpers SECURITY DEFINER (saltan la RLS de las tablas de entidades) ─────
CREATE OR REPLACE FUNCTION public.can_write_group_image(gid text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM groups WHERE id::text = gid AND owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.can_write_org_logo(oid text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM organizations WHERE id::text = oid AND owner_id = auth.uid());
$$;

-- Comunidades: lo gestionan owner o staff; aquí basta con autenticado (el server
-- action valida el permiso fino). Si tu tabla communities tiene owner_id, puedes
-- endurecerlo igual que arriba.
CREATE OR REPLACE FUNCTION public.can_write_community_image(cid text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- ── 3. Políticas de storage ───────────────────────────────────────────────────
-- group-images
DROP POLICY IF EXISTS "Subir imagen de grupo si eres owner" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar imagen de grupo si eres owner" ON storage.objects;
DROP POLICY IF EXISTS "Borrar imagen de grupo si eres owner" ON storage.objects;
DROP POLICY IF EXISTS "Leer imágenes de grupo públicamente" ON storage.objects;
DROP POLICY IF EXISTS "Leer group-images" ON storage.objects;
CREATE POLICY "group-images read"   ON storage.objects FOR SELECT USING (bucket_id = 'group-images');
CREATE POLICY "group-images insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'group-images' AND public.can_write_group_image((storage.foldername(name))[1]));
CREATE POLICY "group-images update" ON storage.objects FOR UPDATE USING (bucket_id = 'group-images' AND public.can_write_group_image((storage.foldername(name))[1]));
CREATE POLICY "group-images delete" ON storage.objects FOR DELETE USING (bucket_id = 'group-images' AND public.can_write_group_image((storage.foldername(name))[1]));

-- org-logos
DROP POLICY IF EXISTS "Leer org-logos" ON storage.objects;
CREATE POLICY "org-logos read"   ON storage.objects FOR SELECT USING (bucket_id = 'org-logos');
CREATE POLICY "org-logos insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'org-logos' AND public.can_write_org_logo((storage.foldername(name))[1]));
CREATE POLICY "org-logos update" ON storage.objects FOR UPDATE USING (bucket_id = 'org-logos' AND public.can_write_org_logo((storage.foldername(name))[1]));
CREATE POLICY "org-logos delete" ON storage.objects FOR DELETE USING (bucket_id = 'org-logos' AND public.can_write_org_logo((storage.foldername(name))[1]));

-- community-images
DROP POLICY IF EXISTS "Leer community-images" ON storage.objects;
CREATE POLICY "community-images read"   ON storage.objects FOR SELECT USING (bucket_id = 'community-images');
CREATE POLICY "community-images insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community-images' AND public.can_write_community_image((storage.foldername(name))[1]));
CREATE POLICY "community-images update" ON storage.objects FOR UPDATE USING (bucket_id = 'community-images' AND public.can_write_community_image((storage.foldername(name))[1]));
CREATE POLICY "community-images delete" ON storage.objects FOR DELETE USING (bucket_id = 'community-images' AND public.can_write_community_image((storage.foldername(name))[1]));
