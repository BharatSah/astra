-- Fix Supabase advisor warning 0011_function_search_path_mutable.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
      OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false);
$$;
