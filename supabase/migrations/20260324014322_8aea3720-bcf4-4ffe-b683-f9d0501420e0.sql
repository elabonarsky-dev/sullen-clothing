
CREATE OR REPLACE FUNCTION public.get_okendo_migration_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total', COUNT(*)::integer,
    'claimed', COUNT(*) FILTER (WHERE claimed = true)::integer,
    'unclaimed', COUNT(*) FILTER (WHERE claimed = false)::integer,
    'totalPoints', COALESCE(SUM(corrected_balance), 0)::bigint,
    'claimedPoints', COALESCE(SUM(corrected_balance) FILTER (WHERE claimed = true), 0)::bigint,
    'unclaimedPoints', COALESCE(SUM(corrected_balance) FILTER (WHERE claimed = false), 0)::bigint,
    'tierBreakdown', (
      SELECT json_agg(json_build_object(
        'tier', tier,
        'count', cnt,
        'claimed', claimed_cnt,
        'points', pts
      ))
      FROM (
        SELECT tier,
               COUNT(*)::integer as cnt,
               COUNT(*) FILTER (WHERE claimed = true)::integer as claimed_cnt,
               COALESCE(SUM(corrected_balance), 0)::bigint as pts
        FROM public.okendo_migration
        GROUP BY tier
        ORDER BY pts DESC
      ) t
    )
  )
  FROM public.okendo_migration
$$;
