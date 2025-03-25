-- Create function to safely increment a numeric value
CREATE OR REPLACE FUNCTION increment(amount numeric)
RETURNS numeric
LANGUAGE sql
AS $$
  SELECT COALESCE($1, 0);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment(numeric) TO authenticated; 