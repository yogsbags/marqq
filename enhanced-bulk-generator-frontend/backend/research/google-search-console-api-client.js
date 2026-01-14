#!/usr/bin/env node

/**
 * Google Search Console API Direct Client
 * Direct integration with Google Search Console API for real performance data
 *
 * Setup:
 * 1. Enable Search Console API: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
 * 2. Create service account or OAuth2 credentials
 * 3. Add service account email to Search Console property with "Full" permission
 * 4. Set environment variable:
 *    - GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 */

const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

class GoogleSearchConsoleAPIClient {
  constructor(config = {}) {
    // Service account credentials
    this.serviceAccountPath = config.serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.siteUrl = config.siteUrl || 'https://plindia.com';

    // API configuration
    this.apiUrl = 'https://searchconsole.googleapis.com/v1';

    // Access token cache
    this.accessToken = null;
    this.tokenExpiry = null;

    console.log(`🔌 Google Search Console API client initialized for ${this.siteUrl}`);
  }

  /**
   * Get access token using service account
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = new GoogleAuth({
        keyFile: this.serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
      });

      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      this.accessToken = accessToken.token;
      this.tokenExpiry = Date.now() + 3600000; // 1 hour

      console.log('✅ Got GSC access token');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to get GSC access token:', error.message);
      throw error;
    }
  }

  /**
   * Validate credentials
   */
  validateCredentials() {
    if (!this.serviceAccountPath) {
      console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set');
      console.log('💡 Set environment variable:');
      console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
      return false;
    }

    console.log('✅ GSC API credentials validated');
    return true;
  }

  /**
   * Get search analytics data
   * @param {object} options - Query options
   */
  async searchAnalytics(options = {}) {
    try {
      const accessToken = await this.getAccessToken();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (options.days || 30));

      const requestBody = {
        startDate: options.startDate || startDate.toISOString().split('T')[0],
        endDate: options.endDate || endDate.toISOString().split('T')[0],
        dimensions: options.dimensions || ['query'],
        rowLimit: options.rowLimit || 500,
        startRow: options.startRow || 0
      };

      // Add filters if provided
      if (options.dimensionFilterGroups) {
        requestBody.dimensionFilterGroups = options.dimensionFilterGroups;
      }

      console.log(`🔍 Fetching GSC analytics for ${this.siteUrl}`);
      console.log(`   Date range: ${requestBody.startDate} to ${requestBody.endDate}`);
      console.log(`   Dimensions: ${requestBody.dimensions.join(', ')}`);

      const response = await fetch(
        `${this.apiUrl}/webmasters/sites/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`GSC API error: ${JSON.stringify(data.error)}`);
      }

      const results = (data.rows || []).map(row => this.processAnalyticsRow(row, requestBody.dimensions));

      console.log(`✅ Got ${results.length} analytics rows from GSC`);
      return results;

    } catch (error) {
      console.error('❌ GSC API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Process analytics row
   */
  processAnalyticsRow(row, dimensions) {
    const result = {
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    };

    // Map dimensions to result keys
    dimensions.forEach((dimension, index) => {
      result[dimension] = row.keys[index];
    });

    return result;
  }

  /**
   * Get top-performing keywords
   */
  async getTopKeywords(days = 30, limit = 100) {
    return this.searchAnalytics({
      days,
      dimensions: ['query'],
      rowLimit: limit
    });
  }

  /**
   * Get content gaps (high impressions, low CTR)
   */
  async getContentGaps(options = {}) {
    const keywords = await this.getTopKeywords(options.days || 30, options.limit || 500);

    // Filter for content gap opportunities:
    // - High impressions (proven demand)
    // - Low CTR (poor engagement)
    // - Position 5-20 (rankable but needs improvement)
    const gaps = keywords.filter(kw => {
      return kw.impressions >= (options.minImpressions || 100) &&
             kw.ctr < (options.maxCtr || 0.02) &&
             kw.position >= (options.minPosition || 5) &&
             kw.position <= (options.maxPosition || 20);
    });

    // Calculate opportunity score and potential traffic
    const gapsWithOpportunity = gaps.map(gap => {
      // Estimate traffic if we improve to position 3-5
      const targetCtr = 0.15; // Typical CTR for position 3-5
      const potentialClicks = Math.round(gap.impressions * targetCtr);
      const trafficGain = potentialClicks - gap.clicks;

      return {
        ...gap,
        potentialClicks,
        trafficGain,
        opportunityScore: this.calculateOpportunityScore(gap, trafficGain)
      };
    });

    // Sort by opportunity score
    gapsWithOpportunity.sort((a, b) => b.opportunityScore - a.opportunityScore);

    console.log(`✅ Identified ${gapsWithOpportunity.length} content gap opportunities`);
    return gapsWithOpportunity;
  }

  /**
   * Calculate opportunity score (0-100)
   */
  calculateOpportunityScore(gap, trafficGain) {
    // Factors:
    // 1. Traffic gain potential (40%)
    // 2. Current impressions (30%)
    // 3. Current position (20%)
    // 4. Current CTR gap (10%)

    const trafficScore = Math.min(trafficGain / 10, 40); // Max 40 points
    const impressionScore = Math.min(gap.impressions / 100, 30); // Max 30 points
    const positionScore = Math.max(0, 20 - gap.position); // Max 20 points (higher position = lower score)
    const ctrScore = Math.min((0.15 - gap.ctr) * 100, 10); // Max 10 points

    return Math.round(trafficScore + impressionScore + positionScore + ctrScore);
  }

  /**
   * Get top pages
   */
  async getTopPages(days = 30, limit = 100) {
    return this.searchAnalytics({
      days,
      dimensions: ['page'],
      rowLimit: limit
    });
  }

  /**
   * Get search appearance types
   */
  async getSearchAppearance(days = 30) {
    return this.searchAnalytics({
      days,
      dimensions: ['searchAppearance'],
      rowLimit: 100
    });
  }

  /**
   * Get device distribution
   */
  async getDeviceDistribution(days = 30) {
    return this.searchAnalytics({
      days,
      dimensions: ['device'],
      rowLimit: 10
    });
  }

  /**
   * Get country distribution
   */
  async getCountryDistribution(days = 30, limit = 20) {
    return this.searchAnalytics({
      days,
      dimensions: ['country'],
      rowLimit: limit
    });
  }

  /**
   * List verified sites
   */
  async listSites() {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.apiUrl}/webmasters/sites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`GSC API error: ${JSON.stringify(data.error)}`);
      }

      const sites = data.siteEntry || [];
      console.log(`✅ Found ${sites.length} verified sites`);
      return sites;

    } catch (error) {
      console.error('❌ Failed to list sites:', error.message);
      throw error;
    }
  }

  /**
   * Get keyword performance over time
   */
  async getKeywordTrend(keyword, days = 90) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.searchAnalytics({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query', 'date'],
      rowLimit: 1000,
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'query',
              operator: 'equals',
              expression: keyword
            }
          ]
        }
      ]
    });
  }
}

module.exports = GoogleSearchConsoleAPIClient;

// CLI testing
if (require.main === module) {
  const siteUrl = process.argv[2] || 'https://plindia.com';
  const client = new GoogleSearchConsoleAPIClient({ siteUrl });

  if (!client.validateCredentials()) {
    console.log('\n❌ Missing credentials. Set environment variable:');
    console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    console.log('\n📚 Setup guide: https://developers.google.com/webmaster-tools/v1/quickstart');
    process.exit(1);
  }

  // Test: Get content gaps
  client.getContentGaps({ days: 30, limit: 10 })
    .then(gaps => {
      console.log('\n📊 CONTENT GAP OPPORTUNITIES:');
      console.log('='.repeat(80));

      gaps.slice(0, 10).forEach((gap, index) => {
        console.log(`\n${index + 1}. ${gap.query}`);
        console.log(`   Impressions: ${gap.impressions.toLocaleString()}`);
        console.log(`   Clicks: ${gap.clicks}`);
        console.log(`   CTR: ${(gap.ctr * 100).toFixed(2)}%`);
        console.log(`   Position: ${gap.position.toFixed(1)}`);
        console.log(`   Potential Traffic Gain: +${gap.trafficGain.toLocaleString()} clicks/month`);
        console.log(`   Opportunity Score: ${gap.opportunityScore}/100`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('✅ Test completed successfully!');
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}
