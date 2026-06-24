-- Función pública para ver el detalle de una partida sin autenticación
-- Usa SECURITY DEFINER para omitir RLS y devolver solo los campos necesarios
-- Ejecutar en Supabase > SQL Editor

CREATE OR REPLACE FUNCTION get_public_play(play_id UUID)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT row_to_json(result) FROM (
    SELECT
      p.id,
      p.played_at,
      p.notes,
      g.name  AS game_name,
      g.image_url AS game_image,
      grp.name AS group_name,
      (
        SELECT json_agg(
          json_build_object(
            'id',          pr.id,
            'score',       pr.score,
            'is_winner',   pr.is_winner,
            'player_name', COALESCE(prof.display_name, pr.guest_name, 'Invitado')
          )
          ORDER BY pr.is_winner DESC, pr.score DESC NULLS LAST
        )
        FROM play_results pr
        LEFT JOIN profiles prof ON prof.id = pr.profile_id
        WHERE pr.play_id = p.id
      ) AS results
    FROM plays p
    JOIN games  g   ON g.id   = p.game_id
    JOIN groups grp ON grp.id = p.group_id
    WHERE p.id = play_id
  ) result
$$;

-- Permitir acceso anónimo a la función
GRANT EXECUTE ON FUNCTION get_public_play(UUID) TO anon;
