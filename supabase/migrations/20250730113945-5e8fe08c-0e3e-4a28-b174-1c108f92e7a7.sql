-- Ensure private functions have proper search_path by recreating them with explicit settings

DROP FUNCTION IF EXISTS private.upsert_telegram_secret(text, text) CASCADE;
DROP FUNCTION IF EXISTS private.get_telegram_secret(text) CASCADE;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS private.decrypted_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Recreate functions with explicit search_path
CREATE FUNCTION private.upsert_telegram_secret(
  p_key text,
  p_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private'
AS $$
BEGIN
  INSERT INTO private.decrypted_secrets (name, secret)
  VALUES (p_key, p_value)
  ON CONFLICT (name) 
  DO UPDATE SET 
    secret = EXCLUDED.secret,
    updated_at = now();
END;
$$;

CREATE FUNCTION private.get_telegram_secret(
  p_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private'
AS $$
DECLARE
  v_secret text;
BEGIN
  SELECT secret INTO v_secret
  FROM private.decrypted_secrets
  WHERE name = p_key;
  
  RETURN v_secret;
END;
$$;