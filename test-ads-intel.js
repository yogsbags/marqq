/**
 * Test ads intelligence scraping for PL Capital and competitors.
 * Scrapes 5 ads each from LinkedIn, Facebook, Google via Apify.
 *
 * Run: node test-ads-intel.js
 */

import { readFileSync } from 'fs';

// Load .env
try {
  readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ||= m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch {}

import { createClient } from '@supabase/supabase-js';
import { adsIntelScrape } from './platform/content-engine/automations/handlers/ads.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const COMPANY_ID = '0a2690c7-e37c-4b49-8979-837c9ffd00a3'; // PL Capital

const params = {
  competitors: [
    {
      name: 'PL Capital',
      linkedin_company: 'prabhudaslilladher',
      facebook_page: 'PLCapital',
      google_domain: 'plindia.com',
    },
    {
      name: 'Zerodha',
      linkedin_company: 'zerodha',
      facebook_page: 'zerodha',
      google_domain: 'zerodha.com',
    },
    {
      name: 'Groww',
      linkedin_company: 'groww.in',
      facebook_page: 'Groww',
      google_domain: 'groww.in',
    },
    {
      name: 'Motilal Oswal',
      linkedin_company: 'motilal-oswal-financial-services-ltd',
      facebook_page: 'MotilalOswal',
      google_domain: 'motilaloswal.com',
    },
  ],
  platforms: ['linkedin', 'facebook', 'google'],
  country: 'IN',
  limit: 5,
};

console.log('🚀 Starting ads intelligence scrape...');
console.log(`Company: PL Capital (${COMPANY_ID})`);
console.log(`Competitors: ${params.competitors.map(c => c.name).join(', ')}`);
console.log(`Limit: ${params.limit} ads per competitor per platform\n`);

const result = await adsIntelScrape(params, COMPANY_ID, supabase);

console.log('\n=== RESULT ===');
console.log('Status:', result.status);
console.log('Total new ads stored:', result.total_new);
console.log('\nDigest:\n' + result.digest);

if (result.error) {
  console.error('Error:', result.error);
}
