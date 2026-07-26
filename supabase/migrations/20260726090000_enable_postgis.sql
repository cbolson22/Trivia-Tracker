-- Supabase projects have an `extensions` schema pre-created for exactly this
-- purpose (keeps public schema free of extension-owned objects/types).
create extension if not exists postgis with schema extensions;
