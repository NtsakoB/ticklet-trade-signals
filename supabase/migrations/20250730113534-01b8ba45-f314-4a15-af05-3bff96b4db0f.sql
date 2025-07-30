-- Drop and recreate private schema functions with proper search_path

DROP FUNCTION IF EXISTS private.upsert_telegram_secret(text, text);
DROP FUNCTION IF EXISTS private.get_telegram_secret(text);

CREATE OR REPLACE FUNCTION private.upsert_telegram_secret(
  p_key text,
  p_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  -- Store encrypted telegram secret
  INSERT INTO private.decrypted_secrets (name, secret)
  VALUES (p_key, p_value)
  ON CONFLICT (name) 
  DO UPDATE SET 
    secret = EXCLUDED.secret,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION private.get_telegram_secret(
  p_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
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