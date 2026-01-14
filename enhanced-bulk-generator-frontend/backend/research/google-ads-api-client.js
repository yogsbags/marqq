#!/usr/bin/env node

/**
 * Google Ads API Direct Client
 * Direct integration with Google Ads API for keyword research
 *
 * Setup:
 * 1. Get credentials from: https://console.cloud.google.com/apis/credentials
 * 2. Enable Google Ads API: https://console.cloud.google.com/apis/library/googleads.googleapis.com
 * 3. Get refresh token using OAuth2 flow
 * 4. Set environment variables:
 *    - GOOGLE_ADS_DEVELOPER_TOKEN
 *    - GOOGLE_ADS_CLIENT_ID
 *    - GOOGLE_ADS_CLIENT_SECRET
 *    - GOOGLE_ADS_REFRESH_TOKEN
 *    - GOOGLE_ADS_CUSTOMER_ID (Manager account ID)
 */

const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');

class GoogleAdsAPIClient {
  constructor(config = {}) {
    // Credentials from environment or config
    this.developerToken = config.developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    this.clientId = config.clientId || process.env.GOOGLE_ADS_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET;
    this.refreshToken = config.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN;
    this.customerId = config.customerId || process.env.GOOGLE_ADS_CUSTOMER_ID;

    // Alternative: Use service account credentials
    this.serviceAccountPath = config.serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // API configuration
    this.apiVersion = 'v16';
    this.apiUrl = `https://googleads.googleapis.com/${this.apiVersion}`;

    // Access token cache
    this.accessToken = null;
    this.tokenExpiry = null;

    console.log('🔌 Google Ads API client initialized');
  }

  /**
   * Get access token using refresh token or service account
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Method 1: Using service account (recommended)
      if (this.serviceAccountPath) {
        const auth = new GoogleAuth({
          keyFile: this.serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/adwords']
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        this.accessToken = accessToken.token;
        this.tokenExpiry = Date.now() + 3600000; // 1 hour

        console.log('✅ Got access token via service account');
        return this.accessToken;
      }

      // Method 2: Using OAuth2 refresh token
      if (this.refreshToken && this.clientId && this.clientSecret) {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: this.refreshToken,
            grant_type: 'refresh_token'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`OAuth2 failed: ${data.error_description || data.error}`);
        }

        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        console.log('✅ Got access token via OAuth2');
        return this.accessToken;
      }

      throw new Error('No valid authentication method configured');

    } catch (error) {
      console.error('❌ Failed to get access token:', error.message);
      throw error;
    }
  }

  /**
   * Validate credentials
   */
  validateCredentials() {
    const hasServiceAccount = !!this.serviceAccountPath;
    const hasOAuth = !!(this.refreshToken && this.clientId && this.clientSecret);
    const hasDeveloperToken = !!this.developerToken;
    const hasCustomerId = !!this.customerId;

    if (!hasDeveloperToken) {
      console.warn('⚠️  GOOGLE_ADS_DEVELOPER_TOKEN not set');
      return false;
    }

    if (!hasCustomerId) {
      console.warn('⚠️  GOOGLE_ADS_CUSTOMER_ID not set');
      return false;
    }

    if (!hasServiceAccount && !hasOAuth) {
      console.warn('⚠️  No authentication method configured');
      console.log('💡 Set either:');
      console.log('   1. GOOGLE_APPLICATION_CREDENTIALS (service account)');
      console.log('   2. GOOGLE_ADS_REFRESH_TOKEN + GOOGLE_ADS_CLIENT_ID + GOOGLE_ADS_CLIENT_SECRET (OAuth2)');
      return false;
    }

    console.log('✅ Google Ads API credentials validated');
    return true;
  }

  /**
   * Get keyword ideas and search volume data
   * @param {Array<string>} keywords - Keywords to analyze
   * @param {string} location - Location (e.g., "India", "United States")
   * @param {string} language - Language code (e.g., "en", "hi")
   */
  async getKeywordIdeas(keywords, location = 'India', language = 'en') {
    try {
      const accessToken = await this.getAccessToken();

      // Map location name to location ID
      const locationId = this.getLocationId(location);
      const languageId = this.getLanguageId(language);

      console.log(`🔍 Fetching keyword ideas for: ${keywords.join(', ')}`);
      console.log(`   Location: ${location} (${locationId})`);
      console.log(`   Language: ${language} (${languageId})`);

      const requestBody = {
        keywordSeed: {
          keywords: keywords
        },
        geoTargetConstants: [`geoTargetConstants/${locationId}`],
        language: `languageConstants/${languageId}`,
        includeAdultKeywords: false
      };

      const response = await fetch(
        `${this.apiUrl}/customers/${this.customerId}/keywordPlanIdeas:generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Google Ads API error: ${JSON.stringify(data.error)}`);
      }

      // Process results
      const results = (data.results || []).map(result => this.processKeywordIdea(result));

      console.log(`✅ Got ${results.length} keyword ideas from Google Ads API`);
      return results;

    } catch (error) {
      console.error('❌ Google Ads API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Process keyword idea response
   */
  processKeywordIdea(result) {
    const metrics = result.keywordIdeaMetrics || {};
    const keyword = result.text;

    return {
      keyword: keyword,
      search_volume: metrics.avgMonthlySearches || 0,
      competition: metrics.competition || 'UNKNOWN',
      competition_index: metrics.competitionIndex || 0,
      low_bid_micros: metrics.lowTopOfPageBidMicros || 0,
      high_bid_micros: metrics.highTopOfPageBidMicros || 0,
      cpc: ((metrics.lowTopOfPageBidMicros || 0) / 1000000).toFixed(2),
      keyword_difficulty: this.calculateDifficulty(metrics),
      monthly_searches: metrics.monthlySearchVolumes || [],
      source: 'Google Ads API',
      confidence: 'very-high'
    };
  }

  /**
   * Calculate keyword difficulty from competition metrics
   */
  calculateDifficulty(metrics) {
    const competition = metrics.competition || 'UNKNOWN';
    const competitionIndex = metrics.competitionIndex || 0;

    // Map Google Ads competition to difficulty score (0-100)
    const competitionMap = {
      'LOW': 20,
      'MEDIUM': 50,
      'HIGH': 80,
      'UNKNOWN': 50
    };

    const baseScore = competitionMap[competition];

    // Adjust with competition index if available
    if (competitionIndex > 0) {
      return Math.round(baseScore * (competitionIndex / 100));
    }

    return baseScore;
  }

  /**
   * Get location ID from location name
   * Common locations for India
   */
  getLocationId(location) {
    const locationMap = {
      'India': '2356',
      'United States': '2840',
      'United Kingdom': '2826',
      'Canada': '2124',
      'Australia': '2036',
      'Singapore': '2702',
      'UAE': '2784'
    };

    return locationMap[location] || '2356'; // Default to India
  }

  /**
   * Get language ID from language code
   */
  getLanguageId(language) {
    const languageMap = {
      'en': '1000',  // English
      'hi': '1039',  // Hindi
      'es': '1003',  // Spanish
      'fr': '1002',  // French
      'de': '1001',  // German
      'ja': '1005',  // Japanese
      'zh': '1017'   // Chinese
    };

    return languageMap[language] || '1000'; // Default to English
  }

  /**
   * Get historical search volume for a specific keyword
   */
  async getSearchVolume(keyword, location = 'India', language = 'en') {
    const results = await this.getKeywordIdeas([keyword], location, language);
    return results.find(r => r.keyword.toLowerCase() === keyword.toLowerCase()) || null;
  }

  /**
   * Batch fetch keyword metrics
   */
  async batchFetchKeywords(keywords, location = 'India', language = 'en') {
    console.log(`🔍 Batch fetching ${keywords.length} keywords...`);

    // Google Ads API allows up to 10 seed keywords per request
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);

      try {
        const batchResults = await this.getKeywordIdeas(batch, location, language);
        results.push(...batchResults);

        // Rate limiting: Wait 1 second between batches
        if (i + batchSize < keywords.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`⚠️  Batch ${i / batchSize + 1} failed:`, error.message);
      }
    }

    console.log(`✅ Batch fetch complete: ${results.length} keywords`);
    return results;
  }
}

module.exports = GoogleAdsAPIClient;

// CLI testing
if (require.main === module) {
  const client = new GoogleAdsAPIClient();

  if (!client.validateCredentials()) {
    console.log('\n❌ Missing credentials. Set environment variables:');
    console.log('   export GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"');
    console.log('   export GOOGLE_ADS_CUSTOMER_ID="123-456-7890"');
    console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    console.log('\n📚 Setup guide: https://developers.google.com/google-ads/api/docs/first-call/overview');
    process.exit(1);
  }

  // Test with sample keywords
  const keywords = process.argv.slice(2);
  if (keywords.length === 0) {
    keywords.push('mutual funds', 'SIP investment', 'index funds');
  }

  client.getKeywordIdeas(keywords, 'India', 'en')
    .then(results => {
      console.log('\n📊 KEYWORD ANALYSIS RESULTS:');
      console.log('='.repeat(80));

      results.forEach(result => {
        console.log(`\n🔑 ${result.keyword}`);
        console.log(`   Search Volume: ${result.search_volume.toLocaleString()}/month`);
        console.log(`   Competition: ${result.competition} (Index: ${result.competition_index})`);
        console.log(`   Difficulty: ${result.keyword_difficulty}/100`);
        console.log(`   CPC: ₹${result.cpc}`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('✅ Test completed successfully!');
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}
