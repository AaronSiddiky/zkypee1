-- Function to get average trial call duration
CREATE OR REPLACE FUNCTION get_average_trial_duration()
RETURNS TABLE (average_duration numeric) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT AVG(total_duration)::numeric
  FROM trial_calls
  WHERE total_duration > 0;
END;
$$;

-- Function to get daily trial counts
CREATE OR REPLACE FUNCTION get_daily_trial_counts(days_back integer DEFAULT 30)
RETURNS TABLE (day date, count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      current_date - (days_back || ' days')::interval,
      current_date,
      '1 day'::interval
    )::date AS day
  )
  SELECT 
    ds.day,
    COUNT(tc.created_at)::bigint
  FROM 
    date_series ds
    LEFT JOIN trial_calls tc ON DATE(tc.created_at) = ds.day
  GROUP BY 
    ds.day
  ORDER BY 
    ds.day;
END;
$$;

-- Function to get conversion rates by variant
CREATE OR REPLACE FUNCTION get_conversion_by_variant()
RETURNS TABLE (
  variant text,
  count bigint,
  conversion_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH variants AS (
    SELECT
      CASE
        WHEN device_fingerprint % 3 = 0 THEN 'control'
        WHEN device_fingerprint % 3 = 1 THEN 'variant_a'
        ELSE 'variant_b'
      END AS variant,
      converted_to_signup
    FROM trial_calls
  )
  SELECT
    v.variant,
    COUNT(*)::bigint,
    SUM(CASE WHEN v.converted_to_signup THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric AS conversion_rate
  FROM
    variants v
  GROUP BY
    v.variant;
END;
$$;

-- Grant access to service role
GRANT EXECUTE ON FUNCTION get_average_trial_duration() TO service_role;
GRANT EXECUTE ON FUNCTION get_daily_trial_counts(integer) TO service_role;
GRANT EXECUTE ON FUNCTION get_conversion_by_variant() TO service_role; 