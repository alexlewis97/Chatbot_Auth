-- Run this in the Supabase SQL Editor if provisioning doesn't set up RLS policies automatically.
-- This grants full CRUD access to authenticated users on all app tables.
-- Replace with stricter policies for production.

-- chatbots
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "chatbots_select_auth" ON public.chatbots FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "chatbots_insert_auth" ON public.chatbots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "chatbots_update_auth" ON public.chatbots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "chatbots_delete_auth" ON public.chatbots FOR DELETE TO authenticated USING (true);

-- user_groups
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_groups_select_auth" ON public.user_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "user_groups_insert_auth" ON public.user_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_groups_update_auth" ON public.user_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_groups_delete_auth" ON public.user_groups FOR DELETE TO authenticated USING (true);

-- user_group_members
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "ugm_select_auth" ON public.user_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "ugm_insert_auth" ON public.user_group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "ugm_delete_auth" ON public.user_group_members FOR DELETE TO authenticated USING (true);

-- chatbot_permissions
ALTER TABLE public.chatbot_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "cp_select_auth" ON public.chatbot_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "cp_insert_auth" ON public.chatbot_permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "cp_delete_auth" ON public.chatbot_permissions FOR DELETE TO authenticated USING (true);

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "up_select_auth" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "up_insert_auth" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "up_update_auth" ON public.user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
