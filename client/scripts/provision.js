/**
 * Build-time provisioning script.
 * Calls the create-table-runner Edge Function to ensure all tables exist.
 * Idempotent — safe to re-run (uses IF NOT EXISTS).
 *
 * Usage: npm run provision
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[provision] ⚠ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — skipping provisioning.');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Table Schemas ----------

const chatbotsTable = {
  schema: 'public',
  table: 'chatbots',
  if_not_exists: true,
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()', primary_key: true },
    { name: 'name', type: 'text', nullable: false },
    { name: 'subject', type: 'text', nullable: false },
    { name: 'description', type: 'text', default: "''" },
    { name: 'is_active', type: 'boolean', default: 'true' },
    { name: 'created_by', type: 'uuid' },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

const userGroupsTable = {
  schema: 'public',
  table: 'user_groups',
  if_not_exists: true,
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()', primary_key: true },
    { name: 'name', type: 'text', nullable: false },
    { name: 'description', type: 'text', default: "''" },
    { name: 'created_by', type: 'uuid' },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

const userGroupMembersTable = {
  schema: 'public',
  table: 'user_group_members',
  if_not_exists: true,
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()', primary_key: true },
    { name: 'group_id', type: 'uuid', nullable: false },
    { name: 'user_id', type: 'uuid', nullable: false },
    { name: 'added_at', type: 'timestamptz', default: 'now()' },
  ],
};

const chatbotPermissionsTable = {
  schema: 'public',
  table: 'chatbot_permissions',
  if_not_exists: true,
  columns: [
    { name: 'id', type: 'uuid', default: 'gen_random_uuid()', primary_key: true },
    { name: 'chatbot_id', type: 'uuid', nullable: false },
    { name: 'user_id', type: 'uuid' },
    { name: 'group_id', type: 'uuid' },
    { name: 'permission_type', type: 'text', default: "'use'", nullable: false },
    { name: 'granted_by', type: 'uuid' },
    { name: 'granted_at', type: 'timestamptz', default: 'now()' },
  ],
};

const userProfilesTable = {
  schema: 'public',
  table: 'user_profiles',
  if_not_exists: true,
  columns: [
    { name: 'id', type: 'uuid', primary_key: true },
    { name: 'email', type: 'text', nullable: false },
    { name: 'display_name', type: 'text', default: "''" },
    { name: 'is_admin', type: 'boolean', default: 'false' },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
  ],
};

const tables = [
  userProfilesTable,
  chatbotsTable,
  userGroupsTable,
  userGroupMembersTable,
  chatbotPermissionsTable,
];

// ---------- RLS Policies ----------
// These ensure authenticated users can read/write all tables.
// In production, replace with stricter role-based policies.

const rlsPolicies = [
  // Enable RLS on all tables
  'ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.chatbot_permissions ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY',

  // chatbots: authenticated can read, insert, update, delete
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chatbots_select_auth' AND tablename = 'chatbots') THEN CREATE POLICY "chatbots_select_auth" ON public.chatbots FOR SELECT TO authenticated USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chatbots_insert_auth' AND tablename = 'chatbots') THEN CREATE POLICY "chatbots_insert_auth" ON public.chatbots FOR INSERT TO authenticated WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chatbots_update_auth' AND tablename = 'chatbots') THEN CREATE POLICY "chatbots_update_auth" ON public.chatbots FOR UPDATE TO authenticated USING (true) WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chatbots_delete_auth' AND tablename = 'chatbots') THEN CREATE POLICY "chatbots_delete_auth" ON public.chatbots FOR DELETE TO authenticated USING (true); END IF; END $$`,

  // user_groups
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_groups_select_auth' AND tablename = 'user_groups') THEN CREATE POLICY "user_groups_select_auth" ON public.user_groups FOR SELECT TO authenticated USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_groups_insert_auth' AND tablename = 'user_groups') THEN CREATE POLICY "user_groups_insert_auth" ON public.user_groups FOR INSERT TO authenticated WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_groups_update_auth' AND tablename = 'user_groups') THEN CREATE POLICY "user_groups_update_auth" ON public.user_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_groups_delete_auth' AND tablename = 'user_groups') THEN CREATE POLICY "user_groups_delete_auth" ON public.user_groups FOR DELETE TO authenticated USING (true); END IF; END $$`,

  // user_group_members
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ugm_select_auth' AND tablename = 'user_group_members') THEN CREATE POLICY "ugm_select_auth" ON public.user_group_members FOR SELECT TO authenticated USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ugm_insert_auth' AND tablename = 'user_group_members') THEN CREATE POLICY "ugm_insert_auth" ON public.user_group_members FOR INSERT TO authenticated WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ugm_delete_auth' AND tablename = 'user_group_members') THEN CREATE POLICY "ugm_delete_auth" ON public.user_group_members FOR DELETE TO authenticated USING (true); END IF; END $$`,

  // chatbot_permissions
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cp_select_auth' AND tablename = 'chatbot_permissions') THEN CREATE POLICY "cp_select_auth" ON public.chatbot_permissions FOR SELECT TO authenticated USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cp_insert_auth' AND tablename = 'chatbot_permissions') THEN CREATE POLICY "cp_insert_auth" ON public.chatbot_permissions FOR INSERT TO authenticated WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cp_delete_auth' AND tablename = 'chatbot_permissions') THEN CREATE POLICY "cp_delete_auth" ON public.chatbot_permissions FOR DELETE TO authenticated USING (true); END IF; END $$`,

  // user_profiles
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'up_select_auth' AND tablename = 'user_profiles') THEN CREATE POLICY "up_select_auth" ON public.user_profiles FOR SELECT TO authenticated USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'up_insert_auth' AND tablename = 'user_profiles') THEN CREATE POLICY "up_insert_auth" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'up_update_auth' AND tablename = 'user_profiles') THEN CREATE POLICY "up_update_auth" ON public.user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true); END IF; END $$`,
];

async function executeSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_create_table`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ p_sql: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
}

async function provision() {
  console.log('[provision] Starting table provisioning...');
  for (const schema of tables) {
    const { data, error } = await supabase.functions.invoke('create-table-runner', { body: schema });
    if (error) {
      console.error(`[provision] ✗ Failed to create "${schema.table}":`, error.message || error);
    } else {
      console.log(`[provision] ✓ ${schema.table}`, data?.sql ? '(created/verified)' : '');
    }
  }

  console.log('[provision] Setting up RLS policies...');
  for (const sql of rlsPolicies) {
    try {
      await executeSQL(sql);
    } catch (err) {
      // Policy may already exist or RPC may not support DO blocks — log and continue
      console.warn(`[provision] ⚠ RLS policy warning:`, err.message?.slice(0, 120));
    }
  }
  console.log('[provision] Done.');
}

provision().catch((err) => {
  console.error('[provision] Fatal error:', err);
  process.exit(1);
});
