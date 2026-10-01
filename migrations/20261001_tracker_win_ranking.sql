CREATE INDEX IF NOT EXISTS idx_play_results_winner_profile_id
  ON public.play_results (profile_id)
  WHERE is_winner IS TRUE AND profile_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_tracker_win_ranking()
RETURNS TABLE (user_rank BIGINT, total_players BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH visible_results AS (
    SELECT pr.profile_id, pr.is_winner
    FROM public.play_results AS pr
    WHERE pr.profile_id IS NOT NULL
  ),
  visible_wins AS (
    SELECT vr.profile_id, COUNT(*)::BIGINT AS win_count
    FROM visible_results AS vr
    WHERE vr.is_winner IS TRUE
    GROUP BY vr.profile_id
  ),
  my_wins AS (
    SELECT COALESCE(
      (SELECT vw.win_count FROM visible_wins AS vw WHERE vw.profile_id = auth.uid()),
      0
    ) AS win_count
  )
  SELECT
    (SELECT COUNT(*) + 1 FROM visible_wins AS vw CROSS JOIN my_wins WHERE vw.win_count > my_wins.win_count)::BIGINT,
    GREATEST((SELECT COUNT(DISTINCT profile_id) FROM visible_results), 1)::BIGINT;
$function$;

REVOKE ALL ON FUNCTION public.get_tracker_win_ranking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tracker_win_ranking() TO authenticated;