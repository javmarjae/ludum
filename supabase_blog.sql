-- Blog posts para posicionamiento SEO y promociones patrocinadas
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null, -- markdown
  cover_image text,
  author_name text not null default 'Equipo Ludum',
  published_at timestamptz,
  is_published boolean not null default false,
  is_sponsored boolean not null default false,
  sponsor_name text,
  sponsor_logo text,
  sponsor_url text,
  tags text[] default '{}',
  seo_title text,
  seo_description text,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para rendimiento
create index if not exists blog_posts_slug_idx on blog_posts(slug);
create index if not exists blog_posts_published_idx on blog_posts(published_at desc) where is_published = true;
create index if not exists blog_posts_tags_idx on blog_posts using gin(tags);

-- RLS: solo lectura pública para posts publicados
alter table blog_posts enable row level security;

drop policy if exists "Lectura pública de posts publicados" on blog_posts;
create policy "Lectura pública de posts publicados"
  on blog_posts for select
  using (is_published = true);

-- Trigger para actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists blog_posts_updated_at on blog_posts;
create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at_column();

-- Post de ejemplo para ver que funciona
insert into blog_posts (slug, title, excerpt, content, author_name, published_at, is_published, tags, seo_title, seo_description)
values (
  'mejores-juegos-mesa-2025',
  'Los mejores juegos de mesa de 2025',
  'Repasamos los lanzamientos más destacados de este año: estrategia, cooperativos, filler y más.',
  '## Un año cargado de novedades

2025 ha traído lanzamientos impresionantes para la comunidad jugadora. Desde complejos juegos de estrategia hasta fillers para partidas rápidas, hay algo para todos.

## Estrategia

Los juegos de estrategia siguen dominando las mesas. Títulos como los herederos de Brass o Root han mantenido el listón muy alto.

## Cooperativos

El género cooperativo no para de crecer. Cada vez más grupos prefieren jugar juntos contra el juego que unos contra otros.

## Fillers imprescindibles

Para esas tardes en las que solo tienes 20 minutos, estos fillers son oro puro. Rápidos de aprender, difíciles de dominar.

## Conclusión

Sea cual sea tu estilo de juego, 2025 tiene algo para ti. ¡Sigue descubriendo en Ludum!',
  'Equipo Ludum',
  now(),
  true,
  ARRAY['novedades', 'reseñas', '2025'],
  'Los mejores juegos de mesa de 2025 | Ludum',
  'Descubre los mejores lanzamientos de juegos de mesa de 2025: estrategia, cooperativos, fillers y mucho más.'
);
