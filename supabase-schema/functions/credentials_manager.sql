-- Credential Management Functions for Ticklet Trading Bot
-- These functions handle secure credential storage and retrieval

-- Function to encrypt and store user credentials
CREATE OR REPLACE FUNCTION public.store_user_credential(
    p_user_id UUID,
    p_provider TEXT,
    p_credential_type TEXT,
    p_credential_value TEXT,
    p_encryption_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_credential_id UUID;
    v_encrypted_value TEXT;
BEGIN
    -- Generate a new UUID for the credential
    v_credential_id := uuid_generate_v4();
    
    -- Encrypt the credential value using PGP
    -- In production, use a proper encryption key from environment
    v_encrypted_value := pgp_sym_encrypt(p_credential_value, COALESCE(p_encryption_key, 'default_key_change_in_production'));
    
    -- Insert or update the credential
    INSERT INTO public.user_credentials (
        id,
        user_id,
        provider,
        credential_type,
        encrypted_value,
        is_active
    ) VALUES (
        v_credential_id,
        p_user_id,
        p_provider,
        p_credential_type,
        v_encrypted_value,
        true
    )
    ON CONFLICT (user_id, provider, credential_type) 
    DO UPDATE SET 
        encrypted_value = EXCLUDED.encrypted_value,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_credential_id;
    
    RETURN v_credential_id;
END;
$$;

-- Function to retrieve and decrypt user credentials
CREATE OR REPLACE FUNCTION public.get_user_credential(
    p_user_id UUID,
    p_provider TEXT,
    p_credential_type TEXT,
    p_encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted_value TEXT;
    v_decrypted_value TEXT;
BEGIN
    -- Get the encrypted credential
    SELECT encrypted_value INTO v_encrypted_value
    FROM public.user_credentials
    WHERE user_id = p_user_id
      AND provider = p_provider
      AND credential_type = p_credential_type
      AND is_active = true;
    
    -- Return NULL if credential not found
    IF v_encrypted_value IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Decrypt the credential value
    v_decrypted_value := pgp_sym_decrypt(v_encrypted_value, COALESCE(p_encryption_key, 'default_key_change_in_production'));
    
    RETURN v_decrypted_value;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return NULL for security
        RAISE LOG 'Error decrypting credential for user % provider % type %: %', p_user_id, p_provider, p_credential_type, SQLERRM;
        RETURN NULL;
END;
$$;

-- Function to validate if user has required credentials
CREATE OR REPLACE FUNCTION public.user_has_credentials(
    p_user_id UUID,
    p_provider TEXT,
    p_required_types TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.user_credentials
    WHERE user_id = p_user_id
      AND provider = p_provider
      AND credential_type = ANY(p_required_types)
      AND is_active = true;
    
    RETURN v_count = array_length(p_required_types, 1);
END;
$$;

-- Function to deactivate user credentials
CREATE OR REPLACE FUNCTION public.deactivate_user_credential(
    p_user_id UUID,
    p_provider TEXT,
    p_credential_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_credentials
    SET is_active = false,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND provider = p_provider
      AND (p_credential_type IS NULL OR credential_type = p_credential_type);
    
    RETURN FOUND;
END;
$$;