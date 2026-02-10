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
  console.log('[provision] Done.');
}

provision().catch((err) => {
  console.error('[provision] Fatal error:', err);
  process.exit(1);
});
