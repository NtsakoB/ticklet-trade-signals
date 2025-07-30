-- Fix all remaining function search_path issues and enable RLS on missing tables

-- Fix all function search_path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_chat_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_learning_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id bigint, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STRICT SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.team_members 
        WHERE team_id = p_team_id 
          AND user_id = p_user_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_teams_for_user(p_user_id uuid)
RETURNS TABLE(team_id bigint, team_name text, user_role text, joined_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        t.id AS team_id, 
        t.name AS team_name, 
        tm.role AS user_role,
        tm.joined_at
    FROM 
        public.teams t
    JOIN 
        public.team_members tm ON t.id = tm.team_id
    WHERE 
        tm.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.debug_team_membership()
RETURNS TABLE(error_type text, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_team_count BIGINT;
    v_member_count BIGINT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check team count
    SELECT COUNT(*) INTO v_team_count FROM public.teams;
    
    -- Check member count
    SELECT COUNT(*) INTO v_member_count FROM public.team_members;
    
    -- Return diagnostic information
    RETURN QUERY 
    SELECT 'User Context'::TEXT, 
           COALESCE(v_user_id::TEXT, 'No authenticated user') AS error_message
    UNION ALL
    SELECT 'Team Count'::TEXT, 
           v_team_count::TEXT || ' teams exist'
    UNION ALL
    SELECT 'Member Count'::TEXT, 
           v_member_count::TEXT || ' team members exist'
    UNION ALL
    SELECT 'RLS Check'::TEXT, 
           CASE 
               WHEN EXISTS (
                   SELECT 1 
                   FROM information_schema.table_constraints 
                   WHERE table_schema = 'public' 
                     AND table_name IN ('teams', 'team_members') 
                     AND constraint_type = 'FOREIGN KEY'
               ) 
               THEN 'Foreign key constraints verified'
               ELSE 'Missing foreign key constraints'
           END;
END;
$$;

-- Enable RLS on remaining audit tables
ALTER TABLE public.chat_logs_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_entries_audit ENABLE ROW LEVEL SECURITY;

-- Create policies for audit tables (read-only for auditors)
CREATE POLICY "Auditor read chat_logs_audit"
ON public.chat_logs_audit
FOR SELECT
USING (auth.role() = 'auditor' OR auth.uid() = user_id);

CREATE POLICY "Auditor read learning_entries_audit"
ON public.learning_entries_audit
FOR SELECT
USING (auth.role() = 'auditor' OR auth.uid() = user_id);