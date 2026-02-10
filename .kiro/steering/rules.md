---
inclusion: always
---
<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.
   
   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
-------------------------------------------------------------------------------------> 

---
inclusion: always
---
<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.
   
   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
-------------------------------------------------------------------------------------> 
---
inclusion: always
---

# Base42 — Complete Steering Document (v2)

**Description:** Master architecture, infrastructure, and implementation guide for Base42 applications. Governs the use of Supabase to mirror a secure air-gapped PostgREST environment. Updated with lessons learned from real implementation.

---

## 1. Executive Summary & Architecture

### The Dual-Environment Strategy

This application must run in two distinct environments. The code must be "Backend Agnostic" regarding the specific provider, relying strictly on standard **REST/SQL patterns**.

| Feature | **Target Production (Red Network)** | **Current Development (Green Network)** |
|:--------|:------------------------------------|:----------------------------------------|
| **Frontend** | React (Vite) served via Nginx With TailWindCSS and DAISYUI | React (Vite) Localhost |
| **Backend** | **PostgREST** (Standalone) | **Supabase** (PostgREST Wrapper) |
| **Database** | PostgreSQL (Air-gapped) | PostgreSQL (Cloud/Local Supabase) |
| **Auth** | **Keycloak** (OIDC/OAuth2) | **Supabase Auth** (Simulating Keycloak) |
| **Infra** | Manual / Scripted SQL | **Self-Provisioning** (Edge Functions) |

### Critical Architecture Rule: NO SERVER-SIDE CODE

There is **no Express, no Node.js server, no custom backend**. The frontend talks directly to Supabase (PostgREST). All business logic lives in:
- **Frontend** (React) — UI, validation, workflow
- **Edge Functions** (Deno) — Privileged operations (DDL, admin tasks)
- **Database** (PostgreSQL) — RLS policies, constraints, triggers

**AI agents must NEVER generate server-side code (Express, Fastify, etc.) for this project.**

---

## 2. Infrastructure as Code: The "God Mode" (Self-Provisioning)

**Crucial:** We do not rely on manual SQL migrations or console operations. The application includes a **Provisioning Engine** that allows the frontend to create its own database schema dynamically.

### A. The Engine: `create-table-runner` (Edge Function)

This is the reference implementation for the secure Edge Function. It accepts a JSON schema and executes DDL commands via a privileged RPC.

**⚠️ CORS REQUIREMENT:** Every Edge Function MUST handle CORS preflight requests. Browsers send an `OPTIONS` request before any cross-origin `POST`. If the function doesn't handle it, you get a 405 error.

**Source Code (Reference — with CORS fix):**

```typescript
// Edge Function: create-table-runner
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// MANDATORY: CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function validateIdentifier(id: string, fieldName: string) {
  if (typeof id !== 'string' || id.trim() === '') throw new Error(`${fieldName} must be a non-empty string`);
  if (!/^[-_0-9a-zA-Z]+$/.test(id)) throw new Error(`${fieldName} contains invalid characters`);
}

function quoteIdent(id: string) {
  return '"' + id.replace(/"/g, '""') + '"';
}

function buildCreateTableSQL(p: any) {
  validateIdentifier(p.schema, 'schema');
  validateIdentifier(p.table, 'table');
  
  if (!Array.isArray(p.columns) || p.columns.length === 0) throw new Error('columns must be a non-empty array');

  const cols = p.columns.map((c: any) => {
    validateIdentifier(c.name, 'column name');
    if (c.type.includes(';')) throw new Error('Semicolons not allowed in column types');
    
    const parts: string[] = [];
    parts.push(quoteIdent(c.name));
    parts.push(c.type); 
    if (c.primary_key) parts.push('PRIMARY KEY');
    if (c.nullable === false) parts.push('NOT NULL');
    if (c.default !== undefined) parts.push('DEFAULT ' + c.default);
    
    return parts.join(' ');
  });

  const ifNot = p.if_not_exists ? 'IF NOT EXISTS ' : '';
  return `CREATE TABLE ${ifNot}${quoteIdent(p.schema)}.${quoteIdent(p.table)} (\n  ${cols.join(',\n  ')}\n)`;
}

serve(async (req) => {
  // MANDATORY: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response("Only POST allowed", { status: 405, headers: corsHeaders });
    }

    const payload = await req.json();
    const sql = buildCreateTableSQL(payload);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_create_table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'apikey': SERVICE_ROLE!
      },
      body: JSON.stringify({ p_sql: sql }),
    });

    if (!res.ok) throw new Error(await res.text());
    return new Response(JSON.stringify({ status: 'ok', sql }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### B. Edge Function CORS Template

**Every new Edge Function** must follow this pattern:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // ... actual logic ...
  // ALL responses must include: { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
});
```

### C. Provisioning Logic (Frontend Implementation)

**Step 1: Define the Schema**

```javascript
const productsSchema = {
  "schema": "public",
  "table": "products",
  "if_not_exists": true,
  "columns": [
    { "name": "id", "type": "uuid", "default": "gen_random_uuid()", "primary_key": true },
    { "name": "sku", "type": "varchar(50)", "nullable": false },
    { "name": "name", "type": "text", "nullable": false },
    { "name": "price", "type": "numeric(10,2)", "default": "0.00" },
    { "name": "is_active", "type": "boolean", "default": "true" },
    { "name": "metadata", "type": "jsonb", "default": "'{}'" }, 
    { "name": "created_at", "type": "timestamptz", "default": "now()" }
  ]
}
```

**Step 2: Invoke the Provisioner**

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

async function provisionTable(schemaPayload) {
  const { data, error } = await supabase.functions.invoke('create-table-runner', {
    body: schemaPayload
  })

  if (error) {
    console.error('CRITICAL: Infrastructure provisioning failed', error)
    throw error
  }
  console.log('SUCCESS: Infrastructure Ready', data)
}
```

---

## 3. Data Access Layer (Client-Side)

All UI components must use the `@supabase/supabase-js` client. This ensures type safety and maintains compatibility with PostgREST.

### Initialization (with Graceful Fallback)

The Supabase client must handle missing configuration gracefully. If env vars are missing, the app should show a setup screen — not crash silently with a blank page.

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>);
```

**Rule:** App.tsx must check `isSupabaseConfigured` before any Supabase calls and render a setup/instructions screen if false.

### A. Reading Data (SELECT)

**1. Basic Read**

```javascript
const { data: users, error } = await supabase
  .from('user_profiles')
  .select('*')
```

**2. Specific Columns (Optimization)**

```javascript
const { data: users } = await supabase
  .from('user_profiles')
  .select('id, username, bio')
```

**3. Foreign Keys (Joins)**

*Crucial:* Use the PostgREST embedded resource syntax.

```javascript
const { data: shifts } = await supabase
  .from('shifts')
  .select(`
    id, 
    start_time,
    user_profiles ( username, role ) 
  `)
```

**4. Filtering & Pagination**

```javascript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .lt('price', 50)
  .order('price', { ascending: true })
  .range(0, 9)
```

### B. Writing Data (CRUD)

**1. Insert** — Always chain `.select()` to get the inserted row back.

```javascript
const { data, error } = await supabase
  .from('user_profiles')
  .insert([{ username: 'soldier_a', bio: 'Logistics' }])
  .select()
```

**2. Upsert**

```javascript
const { data } = await supabase
  .from('user_profiles')
  .upsert({ id: 'uuid-123', username: 'updated_name' })
  .select()
```

**3. Update** — WARNING: Always include a filter (`.eq`).

```javascript
const { error } = await supabase
  .from('products')
  .update({ price: 19.99 })
  .eq('sku', 'A123')
```

**4. Delete**

```javascript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', 'uuid-to-delete')
```

### C. Realtime Subscriptions

```javascript
const subscription = supabase.channel('public:shifts')
  .on(
    'postgres_changes', 
    { event: '*', schema: 'public', table: 'shifts' }, 
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

---

## 4. Server-Side / Admin Access (Node.js Pattern)

For backend scripts, migrations, or bulk data seeding only. **This is NOT for application logic.**

**Library:** `postgres` (postgres.js)  
**Connection String:** `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

```javascript
import postgres from 'postgres'
const sql = postgres(process.env.DATABASE_URL)

async function adminTask() {
  const users = await sql`
    SELECT * FROM auth.users 
    WHERE created_at > NOW() - INTERVAL '1 day'
  `
  return users
}
```

---

## 5. Security & Authentication Strategy

### A. The Auth Bridge

* **Production (Keycloak):** JWT with `realm_access.roles`.
* **Development (Supabase):** Supabase Auth with `user_metadata.roles` array.

### B. Sign Up & Sign In (Supabase Auth)

The app supports both sign-up and sign-in via Supabase Auth. The Login page toggles between modes.

**Sign Up:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: window.location.origin,
  },
});
if (error) throw error;
// User receives a confirmation email. After confirming, they can sign in.
```

**Sign In:**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;
// Session is set automatically. onAuthStateChange fires in App.tsx.
```

**UI Pattern:** A single Login page with a toggle link between "כניסה" (sign in) and "הרשמה" (sign up). After successful sign-up, show a success message prompting the user to check their email.

**Auth State Listener (App.tsx):**

```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });
  return () => subscription.unsubscribe();
}, []);
```

### C. Skip-Auth Mode for Development

The app supports a `VITE_SKIP_AUTH=true` env var that bypasses authentication for rapid testing. When enabled:
- The app renders the main UI without requiring login
- Service functions use a placeholder anonymous UUID (`00000000-0000-0000-0000-000000000000`) for `created_by` fields
- The header shows "מצב בדיקה" instead of user email
- The logout button is hidden

**Implementation pattern for services:**

```typescript
const ANONYMOUS_ID = '00000000-0000-0000-0000-000000000000';

async function getCurrentUserId(): Promise<string> {
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return ANONYMOUS_ID;
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('לא מחובר');
  return user.id;
}
```

### C. Row Level Security (RLS)

The database is **Closed by Default**. All tables must have RLS enabled.

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Public Read" ON products FOR SELECT USING (true);

-- Write access
CREATE POLICY "Admins Only" ON products FOR INSERT TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');
```

**⚠️ RLS + Skip-Auth Warning:** When `VITE_SKIP_AUTH=true`, the Supabase client uses the anon key without a user session. RLS policies that check `auth.uid()` will fail. For development, either:
1. Add permissive policies for the anon role, OR
2. Temporarily disable RLS on dev tables

---

## 6. Environment Variables

### Required `.env` file (in `client/` directory)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SKIP_AUTH=false
```

### Rules

* `VITE_SUPABASE_URL` is the **base project URL only** — do NOT append paths like `/functions/v1/...`
* Use `import.meta.env.VITE_*` in frontend code
* Use `Deno.env.get(...)` in Edge Functions
* **NEVER** commit `.env` to Git — only `.env.example`
* Always provide a `.env.example` with placeholder values

---

## 7. Implementation Rules for AI Agents

### 1. No Server-Side Code
* **NEVER** create Express, Fastify, Hono, or any Node.js server
* All data access goes through `@supabase/supabase-js` client
* Privileged operations go through Edge Functions

### 2. Edge Functions Must Handle CORS
* Every Edge Function must include `corsHeaders` and handle `OPTIONS` preflight
* Every response (success AND error) must include CORS headers
* Use the template from Section 2.B

### 3. Supabase Client Must Be Resilient
* Check `isSupabaseConfigured` before any Supabase calls
* Show a helpful setup screen if env vars are missing — never crash silently
* Every `{ data, error }` response must be checked: `if (error) throw error`

### 4. Auth Must Be Optional in Dev
* Support `VITE_SKIP_AUTH=true` for rapid testing without user accounts
* Use a `getCurrentUserId()` helper that returns anonymous UUID when auth is skipped
* Never call `supabase.auth.getUser()` without checking skip-auth first

### 5. Type Consistency
* `id` is strictly `uuid` (with `gen_random_uuid()` default)
* Prices/Costs are `numeric` (never `float`)
* Flexible fields are `jsonb`
* Timestamps are `timestamptz` (with `now()` default)

### 6. UI Standards
* Hebrew RTL throughout (`dir="rtl"`, `lang="he"`)
* Tailwind CSS for styling
* Mobile-friendly responsive design
* Minimal screens, intuitive flow — this is a daily tool, not an enterprise suite

### 7. No Mock Data
* Do not build local array mocks
* If the database is empty, use `create-table-runner` to provision, then seed via `upsert`

### 8. Provisioning & Migrations at Build Time
* **NEVER** include provisioning or migration logic in the UI/frontend code
* All table creation, schema changes, and data migrations must run as **build-time scripts** (e.g. `node scripts/provision.js`)
* The `create-table-runner` Edge Function is called from a Node.js script in `client/scripts/`, not from React components
* Build scripts must be wired into `npm run dev` and `npm run build` so provisioning runs automatically before the app starts
* Use `IF NOT EXISTS` in all table schemas so provisioning is idempotent and safe to re-run
* Schema changes (new columns, new tables) are handled by updating the build script, never by adding UI pages
* A standalone `npm run provision` command must also be available for manual runs

### 9. Project Structure

```
client/                     # React frontend (the ONLY app code)
├── scripts/
│   └── provision.js        # Build-time table provisioning (calls create-table-runner)
├── src/
│   ├── services/           # Supabase client + data access layer
│   ├── pages/              # Page components
│   ├── types/              # TypeScript interfaces & constants
│   ├── components/         # Shared UI components
│   ├── App.tsx             # Root: auth check, routing, layout
│   └── main.tsx            # Entry point
├── .env                    # Local secrets (gitignored)
├── .env.example            # Template for secrets
├── index.html              # RTL Hebrew shell
└── package.json
```

---

**End of Steering Document**
