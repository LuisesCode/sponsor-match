-- =====================================================================
-- Security-Härtung (Supabase-Advisor 0028/0029):
-- handle_new_user() ist SECURITY DEFINER und war via PostgREST-RPC
-- für anon/authenticated aufrufbar. Die Funktion darf ausschließlich
-- vom Signup-Trigger (auth.users-Insert durch supabase_auth_admin)
-- ausgeführt werden.
-- =====================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
