#!/usr/bin/env node

/**
 * Google Analytics 4 API Client (Alternative to GSC)
 * Uses GA4 Data API to get traffic and keyword data
 *
 * Setup:
 * 1. Service account must have access to GA4 property
 * 2. Set environment variable:
 *    - GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 *    - GA4_PROPERTY_ID="309159799"
 *
 * Alternative to GSC for:
 * - Page views and traffic data
 * - Landing pages
 * - Traffic sources
 * - User behavior
 */

const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

class GoogleAnalytics4APIClient {
  constructor(config = {}) {
    // Service account credentials
    this.serviceAccountPath = config.serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.propertyId = config.propertyId || process.env.GA4_PROPERTY_ID || '309159799';

    // API configuration
    this.apiUrl = 'https://analyticsdata.googleapis.com/v1beta';

    // Access token cache
    this.accessToken = null;
    this.tokenExpiry = null;

    console.log(`🔌 Google Analytics 4 API client initialized for property ${this.propertyId}`);
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
        scopes: ['https://www.googleapis.com/auth/analytics.readonly']
      });

      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      this.accessToken = accessToken.token;
      this.tokenExpiry = Date.now() + 3600000; // 1 hour

      console.log('✅ Got GA4 access token');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to get GA4 access token:', error.message);
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

    if (!this.propertyId) {
      console.warn('⚠️  GA4_PROPERTY_ID not set');
      console.log('💡 Set environment variable:');
      console.log('   export GA4_PROPERTY_ID="309159799"');
      return false;
    }

    console.log('✅ GA4 API credentials validated');
    return true;
  }

  /**
   * Run a report
   */
  async runReport(reportRequest) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.apiUrl}/properties/${this.propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportRequest)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`GA4 API error: ${JSON.stringify(data.error)}`);
      }

      return data;

    } catch (error) {
      console.error('❌ GA4 API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get top landing pages (alternative to GSC pages)
   */
  async getTopLandingPages(days = 30, limit = 100) {
    console.log(`🔍 Fetching top ${limit} landing pages from last ${days} days...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reportRequest = {
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [{
        metric: { metricName: 'screenPageViews' },
        desc: true
      }],
      limit: limit
    };

    const data = await this.runReport(reportRequest);

    const results = (data.rows || []).map(row => ({
      page_path: row.dimensionValues[0].value,
      page_title: row.dimensionValues[1].value,
      page_views: parseInt(row.metricValues[0].value),
      sessions: parseInt(row.metricValues[1].value),
      bounce_rate: parseFloat(row.metricValues[2].value),
      avg_session_duration: parseFloat(row.metricValues[3].value)
    }));

    console.log(`✅ Got ${results.length} landing pages from GA4`);
    return results;
  }

  /**
   * Get traffic sources (where visitors come from)
   */
  async getTrafficSources(days = 30) {
    console.log(`🔍 Fetching traffic sources from last ${days} days...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reportRequest = {
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' }
      ],
      orderBys: [{
        metric: { metricName: 'sessions' },
        desc: true
      }],
      limit: 50
    };

    const data = await this.runReport(reportRequest);

    const results = (data.rows || []).map(row => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value),
      page_views: parseInt(row.metricValues[1].value),
      bounce_rate: parseFloat(row.metricValues[2].value)
    }));

    console.log(`✅ Got ${results.length} traffic sources from GA4`);
    return results;
  }

  /**
   * Get organic search traffic (alternative to GSC queries)
   */
  async getOrganicSearchTraffic(days = 30, limit = 100) {
    console.log(`🔍 Fetching organic search traffic from last ${days} days...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reportRequest = {
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: {
            matchType: 'EXACT',
            value: 'organic'
          }
        }
      },
      orderBys: [{
        metric: { metricName: 'sessions' },
        desc: true
      }],
      limit: limit
    };

    const data = await this.runReport(reportRequest);

    const results = (data.rows || []).map(row => ({
      page_path: row.dimensionValues[0].value,
      page_title: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value),
      page_views: parseInt(row.metricValues[1].value),
      bounce_rate: parseFloat(row.metricValues[2].value)
    }));

    console.log(`✅ Got ${results.length} organic search pages from GA4`);
    return results;
  }

  /**
   * Identify content gaps based on GA4 data
   * (Pages with high bounce rate or low session duration)
   */
  async getContentGapsFromGA4(options = {}) {
    console.log('🔍 Analyzing GA4 data for content improvement opportunities...');

    const organicPages = await this.getOrganicSearchTraffic(
      options.days || 30,
      options.limit || 200
    );

    // Filter for content gap opportunities:
    // - High bounce rate (poor engagement)
    // - Decent sessions (proven traffic)
    const gaps = organicPages.filter(page => {
      return page.sessions >= (options.minSessions || 10) &&
             page.bounce_rate >= (options.minBounceRate || 0.60); // 60%+
    });

    // Calculate opportunity score
    const gapsWithOpportunity = gaps.map(gap => {
      const trafficScore = Math.min(gap.sessions / 10, 40);
      const bounceScore = Math.min((gap.bounce_rate - 0.5) * 80, 40);
      const opportunityScore = Math.round(trafficScore + bounceScore);

      return {
        ...gap,
        opportunityScore,
        issue: 'High bounce rate - content needs improvement',
        potential_improvement: Math.round(gap.sessions * (1 - gap.bounce_rate))
      };
    });

    // Sort by opportunity score
    gapsWithOpportunity.sort((a, b) => b.opportunityScore - a.opportunityScore);

    console.log(`✅ Identified ${gapsWithOpportunity.length} content improvement opportunities`);
    return gapsWithOpportunity;
  }
}

module.exports = GoogleAnalytics4APIClient;

// CLI testing
if (require.main === module) {
  const propertyId = process.argv[2] || process.env.GA4_PROPERTY_ID || '309159799';
  const client = new GoogleAnalytics4APIClient({ propertyId });

  if (!client.validateCredentials()) {
    console.log('\n❌ Missing credentials. Set environment variables:');
    console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    console.log('   export GA4_PROPERTY_ID="309159799"');
    console.log('\n📚 Setup guide: https://developers.google.com/analytics/devguides/reporting/data/v1');
    process.exit(1);
  }

  // Test: Get content gaps from GA4
  client.getContentGapsFromGA4({ days: 30, limit: 10 })
    .then(gaps => {
      console.log('\n📊 CONTENT IMPROVEMENT OPPORTUNITIES (from GA4):');
      console.log('='.repeat(80));

      gaps.slice(0, 10).forEach((gap, index) => {
        console.log(`\n${index + 1}. ${gap.page_title || gap.page_path}`);
        console.log(`   Path: ${gap.page_path}`);
        console.log(`   Sessions: ${gap.sessions.toLocaleString()}`);
        console.log(`   Page Views: ${gap.page_views.toLocaleString()}`);
        console.log(`   Bounce Rate: ${(gap.bounce_rate * 100).toFixed(1)}%`);
        console.log(`   Issue: ${gap.issue}`);
        console.log(`   Potential Improvement: +${gap.potential_improvement} engaged sessions`);
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
