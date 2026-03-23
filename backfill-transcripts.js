/**
 * Backfill intelligence + transcripts for youtube_videos using Supadata /extract.
 * Run: node backfill-transcripts.js [--limit=N] [--company=COMPANY_ID] [--missing-intel] [--min-views=N]
 *
 *   --missing-intel   backfill only videos where intelligence IS NULL (default: transcript IS NULL)
 *   --min-views=N     only process videos with view_count >= N
 *   --top-views       order by view_count DESC (default: upload_date DESC)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

try {
  readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ||= m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch {}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (key, def) => args.find(a => a.startsWith(`--${key}=`))?.split('=')[1] ?? def;
const LIMIT        = parseInt(getArg('limit', '999'));
const COMPANY_ID   = getArg('company', '0a2690c7-e37c-4b49-8979-837c9ffd00a3');
const MISSING_INTEL = args.includes('--missing-intel');
const MIN_VIEWS    = getArg('min-views', null);
const TOP_VIEWS    = args.includes('--top-views') || MIN_VIEWS !== null;
const POLL_MS      = 2000;
const TIMEOUT_MS   = 120_000;

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
if (!SUPADATA_API_KEY) { console.error('ERROR: SUPADATA_API_KEY not set'); process.exit(1); }

// ── Schema ────────────────────────────────────────────────────────────────────
const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    summary:      { type: 'string',  description: '2-3 sentence summary of the video' },
    topics:       { type: 'array',   items: { type: 'string' }, description: 'Main topics covered' },
    key_messages: { type: 'array',   items: { type: 'string' }, description: 'Key takeaways or insights' },
    content_type: { type: 'string',  description: 'One of: educational, news_analysis, promotional, product_demo, social_campaign, event_recap, entertainment' },
    sentiment:    { type: 'string',  description: 'One of: bullish, bearish, neutral, promotional' },
    entities:     { type: 'array',   items: { type: 'string' }, description: 'Stocks, funds, indices, companies, people mentioned' },
    cta:          { type: 'string',  description: 'Call to action if any, else empty string' },
  },
  required: ['summary', 'topics', 'key_messages', 'content_type', 'sentiment', 'entities', 'cta'],
};

// ── Supadata extract ──────────────────────────────────────────────────────────
async function extractVideo(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const headers = { 'x-api-key': SUPADATA_API_KEY, 'Content-Type': 'application/json' };

  try {
    const submitResp = await fetch('https://api.supadata.ai/v1/extract', {
      method: 'POST', headers,
      body: JSON.stringify({ url: videoUrl, schema: EXTRACT_SCHEMA }),
    });

    if (!submitResp.ok) {
      const body = await submitResp.text().catch(() => '');
      if (submitResp.status === 429) return { error: 'rate_limited' };
      return { error: `submit HTTP ${submitResp.status}: ${body.slice(0, 80)}` };
    }

    const { jobId } = await submitResp.json();
    if (!jobId) return { error: 'no jobId returned' };

    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      const pollResp = await fetch(`https://api.supadata.ai/v1/extract/${jobId}`, { headers });
      if (!pollResp.ok) continue;

      const result = await pollResp.json();
      if (result.status === 'completed') return { data: result.data };
      if (result.status === 'failed')    return { error: result.error?.message || 'job failed' };
    }

    return { error: 'timeout' };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

let query = supabase
  .from('youtube_videos')
  .select('video_id, title, channel_name, view_count, duration_secs')
  .eq('company_id', COMPANY_ID)
  .lte('duration_secs', 3300)  // Supadata max: 55 min
  .order(TOP_VIEWS ? 'view_count' : 'upload_date', { ascending: false })
  .limit(LIMIT);

query = MISSING_INTEL
  ? query.is('intelligence', null)
  : query.is('transcript', null);

if (MIN_VIEWS) query = query.gte('view_count', parseInt(MIN_VIEWS));

const { data: videos, error } = await query;
if (error) { console.error('Supabase error:', error.message); process.exit(1); }

const mode = MISSING_INTEL ? 'intelligence=null' : 'transcript=null';
const modeExtra = MIN_VIEWS ? `, min_views=${MIN_VIEWS}` : '';
console.log(`[backfill] ${videos.length} videos (${mode}${modeExtra}, order=${TOP_VIEWS ? 'view_count DESC' : 'upload_date DESC'})\n`);

let success = 0, failed = 0;

for (let i = 0; i < videos.length; i++) {
  const v = videos[i];
  process.stdout.write(`[${i+1}/${videos.length}] "${v.title.slice(0, 52)}"... `);

  const result = await extractVideo(v.video_id);

  if (result.error === 'rate_limited') {
    process.stdout.write('[rate-limited, 15s] ');
    await sleep(15_000);
    const retry = await extractVideo(v.video_id);
    Object.assign(result, retry);
  }

  if (result.data) {
    const intelligence = result.data;
    const { error: uErr } = await supabase.from('youtube_videos')
      .update({ intelligence })
      .eq('video_id', v.video_id).eq('company_id', COMPANY_ID);

    if (!uErr) {
      console.log(`✓  summary: "${intelligence.summary?.slice(0, 70)}..."`);
      console.log(`   type: ${intelligence.content_type} | sentiment: ${intelligence.sentiment}`);
      success++;
    } else {
      console.log(`✗ DB: ${uErr.message}`); failed++;
    }
  } else {
    console.log(`✗ ${result.error}`); failed++;
  }
}

console.log(`\n─── Done ───  ✓ ${success}  ✗ ${failed}  total ${videos.length}`);
