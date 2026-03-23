/**
 * Multi-platform Supadata /extract runner.
 * Pass URLs directly as args, or via --urls-file=path (one URL per line).
 *
 * Run: node extract-social.js <url1> <url2> ...
 *      node extract-social.js --urls-file=urls.txt [--platform=instagram]
 *
 * Results are printed as JSON and optionally saved to --out=results.json
 */

import { readFileSync, writeFileSync } from 'fs';

try {
  readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ||= m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch {}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const args = process.argv.slice(2);
const getArg = (key, def) => args.find(a => a.startsWith(`--${key}=`))?.split('=').slice(1).join('=') ?? def;

const URLS_FILE = getArg('urls-file', null);
const OUT_FILE  = getArg('out', null);
const POLL_MS   = 2000;
const TIMEOUT_MS = 120_000;

// Collect URLs from args + optional file
let urls = args.filter(a => !a.startsWith('--'));
if (URLS_FILE) {
  try {
    const lines = readFileSync(URLS_FILE, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    urls = [...urls, ...lines];
  } catch (e) { console.error(`Cannot read ${URLS_FILE}: ${e.message}`); process.exit(1); }
}

if (!urls.length) {
  console.error('Usage: node extract-social.js <url1> <url2> ...\n       node extract-social.js --urls-file=urls.txt');
  process.exit(1);
}

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
if (!SUPADATA_API_KEY) { console.error('ERROR: SUPADATA_API_KEY not set'); process.exit(1); }

// ── Schema (same as ytdlp.js) ─────────────────────────────────────────────────
const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    summary:      { type: 'string',  description: '2-3 sentence summary of the video' },
    topics:       { type: 'array',   items: { type: 'string' }, description: 'Main topics covered' },
    key_messages: { type: 'array',   items: { type: 'string' }, description: 'Key takeaways or insights' },
    content_type: { type: 'string',  description: 'One of: educational, news_analysis, promotional, product_demo, social_campaign, event_recap, entertainment' },
    sentiment:    { type: 'string',  description: 'One of: bullish, bearish, neutral, promotional' },
    entities:     { type: 'array',   items: { type: 'string' }, description: 'Stocks, funds, indices, companies, people explicitly mentioned' },
    cta:          { type: 'string',  description: 'Call to action if any, else empty string' },
  },
  required: ['summary', 'topics', 'key_messages', 'content_type', 'sentiment', 'entities', 'cta'],
};

async function extractUrl(url) {
  const headers = { 'x-api-key': SUPADATA_API_KEY, 'Content-Type': 'application/json' };

  try {
    const submitResp = await fetch('https://api.supadata.ai/v1/extract', {
      method: 'POST', headers,
      body: JSON.stringify({ url, schema: EXTRACT_SCHEMA }),
    });

    if (!submitResp.ok) {
      const body = await submitResp.text().catch(() => '');
      if (submitResp.status === 429) return { error: 'rate_limited' };
      return { error: `HTTP ${submitResp.status}: ${body.slice(0, 120)}` };
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
console.log(`[extract-social] ${urls.length} URLs to process\n`);

const results = [];
let success = 0, failed = 0;

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  process.stdout.write(`[${i+1}/${urls.length}] ${url.slice(0, 80)}... `);

  let result = await extractUrl(url);

  if (result.error === 'rate_limited') {
    process.stdout.write('[rate-limited, 15s] ');
    await sleep(15_000);
    result = await extractUrl(url);
  }

  if (result.data) {
    const d = result.data;
    console.log(`✓`);
    console.log(`   summary:  ${d.summary?.slice(0, 100)}...`);
    console.log(`   type: ${d.content_type} | sentiment: ${d.sentiment} | entities: ${(d.entities || []).slice(0, 4).join(', ')}`);
    results.push({ url, ...d });
    success++;
  } else {
    console.log(`✗ ${result.error}`);
    results.push({ url, error: result.error });
    failed++;
  }

  // Small gap between requests
  if (i < urls.length - 1) await sleep(500);
}

console.log(`\n─── Done ───  ✓ ${success}  ✗ ${failed}  total ${urls.length}`);

if (OUT_FILE) {
  writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${OUT_FILE}`);
} else {
  console.log('\n─── Full Results ───');
  console.log(JSON.stringify(results, null, 2));
}
