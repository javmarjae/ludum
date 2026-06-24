-- Catálogo de juegos de organizaciones (tiendas y asociaciones)
-- Permite marcar juegos como disponibles, en venta o en préstamo

create type catalog_status as enum ('disponible', 'en_venta', 'en_prestamo');

create table if not exists organization_catalog (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  game_id        uuid not null references games(id) on delete cascade,
  status         catalog_status not null default 'disponible',
  price          numeric(10,2),          -- solo relevante si status = 'en_venta'
  notes          text,
  added_at       timestamptz not null default now(),
  constraint organization_catalog_unique unique (organization_id, game_id)
);

-- Índices
create index if not exists organization_catalog_org_idx on organization_catalog(organization_id);
create index if not exists organization_catalog_status_idx on organization_catalog(organization_id, status);

-- RLS
alter table organization_catalog enable row level security;

-- Lectura pública
create policy "catalog_read_public"
  on organization_catalog for select
  using (true);

-- Escritura: owner o admin de la organización
create policy "catalog_write_owner_admin"
  on organization_catalog for insert
  with check (
    exists (
      select 1 from organizations o
      where o.id = organization_catalog.organization_id
        and (o.owner_id = auth.uid()
          or exists (
            select 1 from organization_members m
            where m.organization_id = o.id
              and m.profile_id = auth.uid()
              and m.role in ('admin')
          ))
    )
  );

create policy "catalog_update_owner_admin"
  on organization_catalog for update
  using (
    exists (
      select 1 from organizations o
      where o.id = organization_catalog.organization_id
        and (o.owner_id = auth.uid()
          or exists (
            select 1 from organization_members m
            where m.organization_id = o.id
              and m.profile_id = auth.uid()
              and m.role in ('admin')
          ))
    )
  );

create policy "catalog_delete_owner_admin"
  on organization_catalog for delete
  using (
    exists (
      select 1 from organizations o
      where o.id = organization_catalog.organization_id
        and (o.owner_id = auth.uid()
          or exists (
            select 1 from organization_members m
            where m.organization_id = o.id
              and m.profile_id = auth.uid()
              and m.role in ('admin')
          ))
    )
  );
