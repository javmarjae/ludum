-- Eventos cerca de ti
-- Ejecutar en Supabase > SQL Editor

-- Ciudad y rol de creador de eventos en perfiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_event_creator BOOLEAN DEFAULT false;

-- Tabla principal de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('tournament', 'fair')),
  location_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  image_url TEXT,
  capacity INTEGER,
  registration_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asistentes / interesados por evento
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('interested', 'going')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver eventos publicados
CREATE POLICY "Ver eventos publicados" ON events
  FOR SELECT USING (is_published = true);

-- Solo usuarios con rol event_creator pueden crear eventos
CREATE POLICY "Crear eventos" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_event_creator = true)
  );

-- Creadores pueden editar sus propios eventos
CREATE POLICY "Editar propios eventos" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Creadores pueden eliminar sus propios eventos
CREATE POLICY "Borrar propios eventos" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- Usuarios autenticados pueden ver asistentes
CREATE POLICY "Ver asistentes" ON event_attendees
  FOR SELECT USING (true);

-- Usuario autenticado puede apuntarse
CREATE POLICY "Apuntarse a evento" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuario puede cambiar su estado de asistencia
CREATE POLICY "Cambiar estado asistencia" ON event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuario puede cancelar su asistencia
CREATE POLICY "Cancelar asistencia" ON event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- RPC: eventos dentro de un radio (Haversine, en km)
CREATE OR REPLACE FUNCTION events_near(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  created_by UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  location_name TEXT,
  city TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  image_url TEXT,
  capacity INTEGER,
  registration_url TEXT,
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    e.id, e.created_by, e.title, e.description, e.type,
    e.location_name, e.city, e.address, e.lat, e.lon,
    e.starts_at, e.ends_at, e.image_url, e.capacity,
    e.registration_url, e.is_published, e.created_at,
    (6371.0 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(user_lat)) * cos(radians(e.lat)) *
        cos(radians(e.lon) - radians(user_lon)) +
        sin(radians(user_lat)) * sin(radians(e.lat))
      ))
    )) AS distance_km
  FROM events e
  WHERE e.is_published = true
    AND e.lat IS NOT NULL
    AND e.lon IS NOT NULL
    AND e.starts_at >= now()
    AND (
      6371.0 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(e.lat)) *
          cos(radians(e.lon) - radians(user_lon)) +
          sin(radians(user_lat)) * sin(radians(e.lat))
        ))
      )
    ) <= radius_km
  ORDER BY e.starts_at ASC
  LIMIT 50;
$$;
