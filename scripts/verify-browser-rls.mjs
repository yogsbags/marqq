#!/usr/bin/env node
/**
 * Mimics browser Supabase queries (anon key + user session JWT).
 * Usage (from repo root marqq/):
 *   node --env-file=.env scripts/verify-browser-rls.mjs
 *
 * Required in .env or environment:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *   Either:
 *     RLS_VERIFY_EMAIL + RLS_VERIFY_PASSWORD
 *   Or (after logging in in the browser):
 *     RLS_VERIFY_ACCESS_TOKEN + RLS_VERIFY_REFRESH_TOKEN
 *   Or (dev only — needs service role; do not use in shared CI logs):
 *     RLS_VERIFY_AUTO_ADMIN=1  and  SUPABASE_SERVICE_ROLE_KEY
 *     Uses RLS_VERIFY_EMAIL or DEFAULT_TEST_EMAIL with admin generateLink + verifyOtp.
 *
 * Optional:
 *   RLS_VERIFY_COMPANY_ID — if auto-discovery via companies.select fails under RLS
 *   RLS_VERIFY_WRITES=0 — skip upsert/update/delete checks (reads only)
 *   SUPABASE_URL, SUPABASE_ANON_KEY — aliases for URL/anon key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(join(root, '.env'));

const url =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const anon =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
let email = process.env.RLS_VERIFY_EMAIL || '';
const password = process.env.RLS_VERIFY_PASSWORD || '';
const accessToken = process.env.RLS_VERIFY_ACCESS_TOKEN || '';
const refreshToken = process.env.RLS_VERIFY_REFRESH_TOKEN || '';
const autoAdmin = process.env.RLS_VERIFY_AUTO_ADMIN === '1' || process.env.RLS_VERIFY_AUTO_ADMIN === 'true';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let companyId = process.env.RLS_VERIFY_COMPANY_ID || '';

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!url || !anon) {
  fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}
const canAutoAdmin =
  autoAdmin &&
  serviceRole &&
  (email || process.env.DEFAULT_TEST_EMAIL) &&
  !accessToken;

if ((!email || !password) && (!accessToken || !refreshToken) && !canAutoAdmin) {
  fail(
    'Provide one of:\n' +
      '  • RLS_VERIFY_EMAIL + RLS_VERIFY_PASSWORD\n' +
      '  • RLS_VERIFY_ACCESS_TOKEN + RLS_VERIFY_REFRESH_TOKEN\n' +
      '  • RLS_VERIFY_AUTO_ADMIN=1 + SUPABASE_SERVICE_ROLE_KEY + (RLS_VERIFY_EMAIL or DEFAULT_TEST_EMAIL)\n',
  );
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];

async function check(name, fn) {
  try {
    const { error } = await fn();
    if (error) {
      results.push({ name, ok: false, code: error.code, message: error.message });
    } else {
      results.push({ name, ok: true });
    }
  } catch (e) {
    results.push({
      name,
      ok: false,
      code: 'throw',
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Runs a callback that performs writes; must throw or resolve clean-up errors */
async function checkWrite(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    let msg;
    if (e instanceof Error) msg = e.message;
    else if (e && typeof e === 'object') {
      const o = e;
      msg =
        (typeof o.message === 'string' && o.message) ||
        (typeof o.details === 'string' && o.details) ||
        JSON.stringify(o);
    } else msg = String(e);
    const code =
      e && typeof e === 'object' && 'code' in e ? String((e).code) : 'throw';
    results.push({
      name,
      ok: false,
      code,
      message: msg,
    });
  }
}

const runWrites =
  process.env.RLS_VERIFY_WRITES !== '0' &&
  process.env.RLS_VERIFY_WRITES !== 'false';

let uid;
if (accessToken) {
  const { data: sess, error: sessErr } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessErr || !sess.user) {
    fail(`setSession failed: ${sessErr?.message || 'no user'}`);
  }
  uid = sess.user.id;
  console.log(`Using access token session (user id ${uid})\n`);
} else if (canAutoAdmin) {
  if (!email) email = process.env.DEFAULT_TEST_EMAIL || '';
  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: linkData, error: gErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (gErr || !linkData?.properties?.email_otp) {
    fail(`admin generateLink failed: ${gErr?.message || 'no email_otp'}`);
  }
  const { data: vData, error: vErr } = await supabase.auth.verifyOtp({
    email,
    token: linkData.properties.email_otp,
    type: 'email',
  });
  if (vErr || !vData?.user) {
    fail(`verifyOtp failed: ${vErr?.message || 'no user'}`);
  }
  uid = vData.user.id;
  console.log(`Admin magic-link session as ${email} (user id ${uid}) [dev only]\n`);
} else {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authErr || !authData.user) {
    fail(`Auth failed: ${authErr?.message || 'no user'}`);
  }
  uid = authData.user.id;
  console.log(`Signed in as ${email} (user id ${uid})\n`);
}

if (!companyId) {
  const c = await supabase.from('companies').select('id').limit(1).maybeSingle();
  if (!c.error && c.data?.id) {
    companyId = c.data.id;
    console.log(`Auto-detected company_id: ${companyId}\n`);
  } else {
    console.warn(
      `Could not auto-select company (error: ${c.error?.message || 'no row'}). ` +
        `Set RLS_VERIFY_COMPANY_ID for company-scoped checks.\n`,
    );
  }
}

// —— persistence.ts (reads) ——
await check('positioning_messaging select .eq(user_id)', () =>
  supabase.from('positioning_messaging').select('*').eq('user_id', uid).maybeSingle(),
);

await check('sales_enablement select .eq(user_id)', () =>
  supabase.from('sales_enablement').select('*').eq('user_id', uid).maybeSingle(),
);

await check('pricing_intelligence select .eq(user_id)', () =>
  supabase.from('pricing_intelligence').select('*').eq('user_id', uid).maybeSingle(),
);

await check('gtm_strategies select active', () =>
  supabase
    .from('gtm_strategies')
    .select('*')
    .eq('user_id', uid)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(),
);

await check('gtm_strategies select list', () =>
  supabase
    .from('gtm_strategies')
    .select('id, name, title, created_at, updated_at, is_active')
    .eq('user_id', uid)
    .order('created_at', { ascending: false }),
);

await check('library_artifacts select .eq(user_id) limit', () =>
  supabase
    .from('library_artifacts')
    .select('*')
    .eq('user_id', uid)
    .order('saved_at', { ascending: false })
    .limit(200),
);

// —— notifications ——
await check('agent_notifications select .eq(user_id)', () =>
  supabase
    .from('agent_notifications')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(50),
);

await check('competitor_alerts select .eq(user_id)', () =>
  supabase
    .from('competitor_alerts')
    .select('*')
    .eq('user_id', uid)
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(100),
);

// —— company-scoped (hooks) ——
if (companyId) {
  await check('competitor_ads select .eq(company_id)', () =>
    supabase
      .from('competitor_ads')
      .select(
        'id,competitor_name,platform,ad_id,advertiser,headline,body,cta_text,destination_url,media_type,media_url,targeting,impressions_min,impressions_max,spend_min,spend_max,currency,is_active,start_date,end_date,scraped_at',
      )
      .eq('company_id', companyId)
      .order('scraped_at', { ascending: false })
      .limit(200),
  );

  await check('social_posts select .eq(company_id)', () =>
    supabase
      .from('social_posts')
      .select('id, platform, handle, account_type, post_url, fetched_at, intelligence, raw_data')
      .eq('company_id', companyId)
      .not('intelligence', 'is', null)
      .order('fetched_at', { ascending: false })
      .limit(100),
  );

  await check('social_accounts select .eq(company_id)', () =>
    supabase
      .from('social_accounts')
      .select('id, platform, handle, display_name, account_type, profile_url, active, last_fetched_at')
      .eq('company_id', companyId)
      .order('platform'),
  );
} else {
  results.push({
    name: 'company-scoped tables (competitor_ads, social_posts, social_accounts)',
    ok: false,
    code: 'skip',
    message: 'No RLS_VERIFY_COMPANY_ID and companies.select found no row',
  });
}

// —— writes (reversible where possible) ——
if (runWrites) {
  const marker = `rls-verify-${Date.now()}`;

  await checkWrite('write: positioning_messaging upsert + revert', async () => {
    const { data: before, error: e0 } = await supabase
      .from('positioning_messaging')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (e0) throw e0;
    const { error: e1 } = await supabase.from('positioning_messaging').upsert(
      {
        user_id: uid,
        value_proposition: marker,
        messaging_pillars: [],
        differentiators: [],
        brand_voice_tone: [],
        brand_voice_dos: [],
        brand_voice_donts: [],
        elevator_pitch_short: null,
        elevator_pitch_medium: null,
        elevator_pitch_long: null,
        gtm_context: null,
      },
      { onConflict: 'user_id' },
    );
    if (e1) throw e1;
    if (before) {
      const { error: e2 } = await supabase
        .from('positioning_messaging')
        .upsert(
          {
            user_id: uid,
            value_proposition: before.value_proposition,
            messaging_pillars: before.messaging_pillars ?? [],
            differentiators: before.differentiators ?? [],
            brand_voice_tone: before.brand_voice_tone ?? [],
            brand_voice_dos: before.brand_voice_dos ?? [],
            brand_voice_donts: before.brand_voice_donts ?? [],
            elevator_pitch_short: before.elevator_pitch_short,
            elevator_pitch_medium: before.elevator_pitch_medium,
            elevator_pitch_long: before.elevator_pitch_long,
            gtm_context: before.gtm_context,
          },
          { onConflict: 'user_id' },
        );
      if (e2) throw e2;
    } else {
      const { error: e3 } = await supabase
        .from('positioning_messaging')
        .delete()
        .eq('user_id', uid);
      if (e3) throw e3;
    }
  });

  await checkWrite('write: sales_enablement upsert + revert', async () => {
    const { data: before, error: e0 } = await supabase
      .from('sales_enablement')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (e0) throw e0;
    const { error: e1 } = await supabase.from('sales_enablement').upsert(
      {
        user_id: uid,
        battlecards: [],
        demo_scripts: { rls_verify: marker },
        objection_handlers: [],
        pricing_guidance: { rls_verify: marker },
        gtm_context: null,
      },
      { onConflict: 'user_id' },
    );
    if (e1) throw e1;
    if (before) {
      const { error: e2 } = await supabase.from('sales_enablement').upsert(
        {
          user_id: uid,
          battlecards: before.battlecards ?? [],
          demo_scripts: before.demo_scripts ?? {},
          objection_handlers: before.objection_handlers ?? [],
          pricing_guidance: before.pricing_guidance ?? {},
          gtm_context: before.gtm_context,
        },
        { onConflict: 'user_id' },
      );
      if (e2) throw e2;
    } else {
      const { error: e3 } = await supabase
        .from('sales_enablement')
        .delete()
        .eq('user_id', uid);
      if (e3) throw e3;
    }
  });

  await checkWrite('write: pricing_intelligence upsert + revert', async () => {
    const { data: before, error: e0 } = await supabase
      .from('pricing_intelligence')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (e0) throw e0;
    const { error: e1 } = await supabase.from('pricing_intelligence').upsert(
      {
        user_id: uid,
        competitive_matrix: [],
        value_metrics: [],
        recommendations: { rls_verify: marker },
        elasticity_data: [],
        gtm_context: null,
      },
      { onConflict: 'user_id' },
    );
    if (e1) throw e1;
    if (before) {
      const { error: e2 } = await supabase.from('pricing_intelligence').upsert(
        {
          user_id: uid,
          competitive_matrix: before.competitive_matrix ?? [],
          value_metrics: before.value_metrics ?? [],
          recommendations: before.recommendations,
          elasticity_data: before.elasticity_data ?? [],
          gtm_context: before.gtm_context,
        },
        { onConflict: 'user_id' },
      );
      if (e2) throw e2;
    } else {
      const { error: e3 } = await supabase
        .from('pricing_intelligence')
        .delete()
        .eq('user_id', uid);
      if (e3) throw e3;
    }
  });

  await checkWrite('write: gtm_strategies insert + delete', async () => {
    const { data: row, error: e1 } = await supabase
      .from('gtm_strategies')
      .insert({
        user_id: uid,
        title: marker,
        executive_summary: '',
        assumptions: [],
        sections: [],
        next_steps: [],
        name: 'RLS verify',
        is_active: false,
      })
      .select('id')
      .single();
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from('gtm_strategies')
      .delete()
      .eq('id', row.id)
      .eq('user_id', uid);
    if (e2) throw e2;
  });

  await checkWrite('write: library_artifacts insert + delete', async () => {
    const { data: row, error: e1 } = await supabase
      .from('library_artifacts')
      .insert({
        user_id: uid,
        company_id: companyId || null,
        agent: 'rls-verify',
        artifact: { stub: true, marker },
      })
      .select('id')
      .single();
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from('library_artifacts')
      .delete()
      .eq('id', row.id)
      .eq('user_id', uid);
    if (e2) throw e2;
  });

  await checkWrite('write: agent_notifications insert + delete', async () => {
    const { data: row, error: e1 } = await supabase
      .from('agent_notifications')
      .insert({
        user_id: uid,
        agent_name: 'rls-verify',
        title: marker,
        summary: 'write check',
        read: false,
        status: 'success',
      })
      .select('id')
      .single();
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from('agent_notifications')
      .delete()
      .eq('id', row.id)
      .eq('user_id', uid);
    if (e2) throw e2;
  });

  await checkWrite('write: agent_notifications update read toggle', async () => {
    const { data: row, error: e0 } = await supabase
      .from('agent_notifications')
      .select('id, read')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (e0) throw e0;
    if (!row?.id) {
      const { data: created, error: ec } = await supabase
        .from('agent_notifications')
        .insert({
          user_id: uid,
          agent_name: 'rls-verify',
          title: marker,
          summary: 'toggle',
          read: false,
          status: 'success',
        })
        .select('id, read')
        .single();
      if (ec) throw ec;
      const nextRead = !created.read;
      const { error: e1 } = await supabase
        .from('agent_notifications')
        .update({ read: nextRead })
        .eq('id', created.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('agent_notifications')
        .update({ read: created.read })
        .eq('id', created.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase
        .from('agent_notifications')
        .delete()
        .eq('id', created.id);
      if (e3) throw e3;
      return;
    }
    const orig = row.read;
    const { error: e1 } = await supabase
      .from('agent_notifications')
      .update({ read: !orig })
      .eq('id', row.id);
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from('agent_notifications')
      .update({ read: orig })
      .eq('id', row.id);
    if (e2) throw e2;
  });

  await checkWrite('write: competitor_alerts insert + delete', async () => {
    const { data: row, error: e1 } = await supabase
      .from('competitor_alerts')
      .insert({
        user_id: uid,
        competitor_name: 'RLS Verify Co',
        alert_type: 'news',
        title: marker,
        summary: 'write check',
        source_url: 'https://example.com/rls-verify',
        archived: false,
        read: false,
      })
      .select('id')
      .single();
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from('competitor_alerts')
      .delete()
      .eq('id', row.id)
      .eq('user_id', uid);
    if (e2) throw e2;
  });

  if (companyId) {
    await checkWrite('write: social_accounts insert + delete', async () => {
      const handle = `rls_verify_${Date.now()}`;
      const { data: row, error: e1 } = await supabase
        .from('social_accounts')
        .insert({
          company_id: companyId,
          platform: 'linkedin',
          handle,
          display_name: 'RLS verify',
          account_type: 'competitor',
          active: true,
        })
        .select('id')
        .single();
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', row.id);
      if (e2) {
        const { error: e3 } = await supabase
          .from('social_accounts')
          .update({ active: false })
          .eq('id', row.id);
        if (e3) throw new Error(`${e2.message}; fallback update: ${e3.message}`);
      }
    });

    await checkWrite('write: social_accounts update active', async () => {
      const handle = `rls_upd_${Date.now()}`;
      const { data: row, error: e1 } = await supabase
        .from('social_accounts')
        .insert({
          company_id: companyId,
          platform: 'linkedin',
          handle,
          account_type: 'competitor',
          active: true,
        })
        .select('id')
        .single();
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('social_accounts')
        .update({ active: false })
        .eq('id', row.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', row.id);
      if (e3) throw e3;
    });
  }
}

// —— summary ——
console.log('Results (browser-equivalent reads + writes):\n');
let bad = 0;
for (const r of results) {
  const status = r.ok ? 'OK ' : 'FAIL';
  console.log(
    `  [${status}] ${r.name}${r.ok ? '' : `\n       ${r.code}: ${r.message}`}`,
  );
  if (!r.ok) bad++;
}

console.log('');
if (bad === 0) {
  console.log('All checked read' + (runWrites ? ' and write' : '') + ' paths passed under RLS for this user.');
  if (!runWrites) {
    console.log('Writes skipped (RLS_VERIFY_WRITES=0). Re-run without it to test upsert/update/delete.');
  }
  process.exit(0);
} else {
  console.error(`${bad} check(s) failed — fix RLS policies, grants, or table/schema (e.g. PGRST205 = table missing).`);
  process.exit(1);
}
