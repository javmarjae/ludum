-- ============================================================
-- FASE 3: Auth + Grupos
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. RLS: activar en todas las tablas
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_games enable row level security;
alter table public.games enable row level security;
alter table public.mechanics enable row level security;
alter table public.categories enable row level security;
alter table public.game_mechanics enable row level security;
alter table public.game_categories enable row level security;


-- 3. Policies: profiles
create policy "Perfil propio visible" on public.profiles
  for select using (true);

create policy "Actualizar perfil propio" on public.profiles
  for update using (auth.uid() = id);


-- 4. Policies: games (lectura pública)
create policy "Juegos visibles para todos" on public.games
  for select using (true);

create policy "Mecánicas visibles" on public.mechanics
  for select using (true);

create policy "Categorías visibles" on public.categories
  for select using (true);

create policy "game_mechanics visible" on public.game_mechanics
  for select using (true);

create policy "game_categories visible" on public.game_categories
  for select using (true);


-- 5. Policies: groups
create policy "Ver grupos donde eres miembro" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and profile_id = auth.uid()
    )
  );

create policy "Crear grupos autenticado" on public.groups
  for insert with check (auth.uid() = owner_id);

create policy "Actualizar grupo si eres owner" on public.groups
  for update using (auth.uid() = owner_id);

-- Permite buscar por invite_code (para unirse)
create policy "Ver grupo por invite_code" on public.groups
  for select using (true);


-- 6. Policies: group_members
create policy "Ver miembros de tu grupo" on public.group_members
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.profile_id = auth.uid()
    )
  );

create policy "Añadirse a un grupo" on public.group_members
  for insert with check (auth.uid() = profile_id);


-- 7. Policies: group_games
create policy "Ver juegos del grupo si eres miembro" on public.group_games
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = group_games.group_id and profile_id = auth.uid()
    )
  );

create policy "Añadir juego al grupo si eres miembro" on public.group_games
  for insert with check (
    exists (
      select 1 from public.group_members
      where group_id = group_games.group_id and profile_id = auth.uid()
    )
  );
