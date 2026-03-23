/**
 * Quick test: YouTube channel monitoring for PL Capital workspace
 * Run: node test-youtube.js
 */

import { ytDlpYoutubeFetch } from './platform/content-engine/automations/handlers/ytdlp.js';
import { createClient } from '@supabase/supabase-js';
// Load .env manually (no dotenv dependency)
import { readFileSync } from 'fs';
try {
  readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ||= m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch {}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COMPANY_ID = '0a2690c7-e37c-4b49-8979-837c9ffd00a3'; // PL Capital

const params = {
  channels: [
    { url: 'https://www.youtube.com/@PrabhudasLilladherIndia', type: 'own',        name: 'Prabhudas Lilladher' },
    { url: 'https://www.youtube.com/@Groww',                   type: 'competitor', name: 'Groww' },
    { url: 'https://www.youtube.com/@zerodhaonline',           type: 'competitor', name: 'Zerodha' },
    { url: 'https://www.youtube.com/@MOFSL',                   type: 'competitor', name: 'Motilal Oswal' },
  ],
  limit: 10,             // last 10 videos per channel
  fetch_transcripts: true,
};

console.log('Starting YouTube fetch...\n');
console.log('Channels:', params.channels.map(c => `${c.type}: ${c.name}`).join(', '));
console.log('Limit per channel:', params.limit, '\n');

const result = await ytDlpYoutubeFetch(params, COMPANY_ID, supabase);

console.log('\n=== RESULT ===');
console.log('Status:', result.status);
console.log('New videos stored:', result.new_videos);
console.log('\n--- Channel breakdown ---');
for (const ch of result.channels || []) {
  console.log(`\n${ch.type.toUpperCase()} | ${ch.channel}`);
  console.log(`  New videos: ${ch.new_count}`);
  for (const v of ch.videos || []) {
    console.log(`  - [${v.upload_date}] "${v.title}"`);
    console.log(`    Views: ${(v.view_count || 0).toLocaleString()} | Transcript: ${v.has_transcript ? '✓' : '✗'}`);
  }
}

if (result.digest) {
  console.log('\n--- Agent Digest ---');
  console.log(result.digest);
}
