-- ============================================================
-- FASE 4: Tracker de partidas
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Las tablas plays y play_results ya están en el schema inicial.
-- Este script añade las RLS policies.

-- RLS
alter table public.plays enable row level security;
alter table public.play_results enable row level security;

-- Plays: solo miembros del grupo pueden ver y crear
create policy "Ver partidas del grupo si eres miembro" on public.plays
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = plays.group_id and profile_id = auth.uid()
    )
  );

create policy "Registrar partida si eres miembro" on public.plays
  for insert with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.group_members
      where group_id = plays.group_id and profile_id = auth.uid()
    )
  );

create policy "Borrar partida si eres el creador" on public.plays
  for delete using (auth.uid() = created_by);

-- Play results
create policy "Ver resultados si eres miembro del grupo" on public.play_results
  for select using (
    exists (
      select 1 from public.plays p
      join public.group_members gm on gm.group_id = p.group_id
      where p.id = play_results.play_id and gm.profile_id = auth.uid()
    )
  );

create policy "Insertar resultados si eres miembro" on public.play_results
  for insert with check (
    exists (
      select 1 from public.plays p
      join public.group_members gm on gm.group_id = p.group_id
      where p.id = play_results.play_id and gm.profile_id = auth.uid()
    )
  );
