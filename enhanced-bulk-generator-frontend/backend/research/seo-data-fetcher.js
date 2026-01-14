#!/usr/bin/env node

/**
 * SEO Data Fetcher
 * Integrates with multiple SEO APIs to fetch accurate keyword metrics
 *
 * Supported APIs (Priority Order):
 * 1. Google Ads API (FREE - Direct integration with official Google Keyword Planner)
 * 2. Google Search Console API (FREE - Real traffic data from your site)
 * 3. Google Custom Search API (FREE - 100 queries/day for coverage detection)
 * 4. Google Ads MCP (FREE - Cursor IDE only, fallback)
 * 5. DataForSEO (Paid - Affordable backup)
 * 6. SEMrush API (Paid)
 * 7. Keywords Everywhere (Paid)
 * 8. AI-Estimated (Free fallback)
 */

const fetch = require('node-fetch');
const GoogleAdsAPIClient = require('./google-ads-api-client');
const GoogleSearchConsoleAPIClient = require('./google-search-console-api-client');
const GoogleCustomSearchAPIClient = require('./google-custom-search-api-client');
const GoogleAnalytics4APIClient = require('./google-analytics-4-api-client');

class SEODataFetcher {
  constructor(config = {}) {
    // Direct Google API Integrations (preferred - FREE)
    this.googleAdsClient = config.googleAdsClient || new GoogleAdsAPIClient();
    this.gscClient = config.gscClient || new GoogleSearchConsoleAPIClient(config);
    this.ga4Client = config.ga4Client || new GoogleAnalytics4APIClient(config);
    this.cseClient = config.cseClient || new GoogleCustomSearchAPIClient(config);
    this.useGoogleAdsAPI = config.useGoogleAdsAPI !== false; // Enable by default
    this.useGSCAPI = config.useGSCAPI !== false; // Enable by default
    this.useGA4API = config.useGA4API !== false; // Enable by default (alternative to GSC)
    this.useCSEAPI = config.useCSEAPI !== false; // Enable by default

    // Legacy MCP Integration (fallback for Cursor IDE)
    this.mcpClient = config.mcpClient || null;
    this.useGoogleAdsMCP = config.useGoogleAdsMCP || false;

    // Paid API credentials from environment variables
    this.dataForSEOLogin = process.env.DATAFORSEO_LOGIN;
    this.dataForSEOPassword = process.env.DATAFORSEO_PASSWORD;
    this.semrushApiKey = process.env.SEMRUSH_API_KEY;
    this.keywordsEverywhereApiKey = process.env.KEYWORDS_EVERYWHERE_API_KEY;

    // Configuration
    this.country = config.country || 'in'; // India
    this.language = config.language || 'en';
    this.location = config.location || 'India';
    this.siteUrl = config.siteUrl || 'https://plindia.com';
    this.useCache = config.useCache !== false;
    this.cache = new Map();

    // API endpoints
    this.apis = {
      dataForSEO: 'https://api.dataforseo.com/v3',
      semrush: 'https://api.semrush.com',
      keywordsEverywhere: 'https://api.keywordseverywhere.com/v1'
    };
  }

  /**
   * Validate API credentials
   */
  validateCredentials() {
    const available = [];

    // Check Google Ads API (direct integration)
    if (this.useGoogleAdsAPI && this.googleAdsClient && this.googleAdsClient.validateCredentials()) {
      available.push('Google Ads API (FREE)');
    }

    // Check legacy MCP integration
    if (this.useGoogleAdsMCP && this.mcpClient) {
      available.push('Google Ads MCP (FREE - Cursor only)');
    }

    // Check paid APIs
    if (this.dataForSEOLogin && this.dataForSEOPassword) {
      available.push('DataForSEO');
    }
    if (this.semrushApiKey) {
      available.push('SEMrush');
    }
    if (this.keywordsEverywhereApiKey) {
      available.push('Keywords Everywhere');
    }

    if (available.length === 0) {
      console.warn('⚠️  No SEO API credentials configured!');
      console.log('💡 Available options:');
      console.log('   1. Google Ads API (FREE): See GOOGLE_APIs_SETUP_GUIDE.md');
      console.log('   2. DataForSEO: export DATAFORSEO_LOGIN="your-login" && export DATAFORSEO_PASSWORD="your-password"');
      console.log('   3. SEMrush: export SEMRUSH_API_KEY="your-key"');
      console.log('   4. Keywords Everywhere: export KEYWORDS_EVERYWHERE_API_KEY="your-key"');
      console.log('\n📚 The system will use AI-estimated metrics until APIs are configured.\n');
      return false;
    }

    console.log(`✅ SEO Data Sources: ${available.join(', ')}`);
    return true;
  }

  /**
   * Fetch keyword metrics from available APIs
   */
  async fetchKeywordMetrics(keyword) {
    // Check cache first
    if (this.useCache && this.cache.has(keyword)) {
      console.log(`📦 Using cached data for: ${keyword}`);
      return this.cache.get(keyword);
    }

    console.log(`🔍 Fetching SEO metrics for: ${keyword}`);

    let metrics = null;

    // Try Google Ads API first (FREE - Direct integration, most accurate!)
    if (this.useGoogleAdsAPI && this.googleAdsClient) {
      try {
        metrics = await this.fetchFromGoogleAdsAPI(keyword);
        if (metrics) {
          console.log(`✅ Got metrics from Google Ads API (FREE)`);
        }
      } catch (error) {
        console.log(`⚠️  Google Ads API failed: ${error.message}`);
      }
    }

    // Try Google Ads MCP as fallback (FREE - Cursor IDE only)
    if (!metrics && this.useGoogleAdsMCP && this.mcpClient) {
      try {
        metrics = await this.fetchFromGoogleAdsMCP(keyword);
        if (metrics) {
          console.log(`✅ Got metrics from Google Ads MCP (FREE)`);
        }
      } catch (error) {
        console.log(`⚠️  Google Ads MCP failed: ${error.message}`);
      }
    }

    // Try DataForSEO as backup (paid but affordable)
    if (!metrics && this.dataForSEOLogin && this.dataForSEOPassword) {
      try {
        metrics = await this.fetchFromDataForSEO(keyword);
        if (metrics) {
          console.log(`✅ Got metrics from DataForSEO`);
        }
      } catch (error) {
        console.log(`⚠️  DataForSEO failed: ${error.message}`);
      }
    }

    // Try SEMrush as backup
    if (!metrics && this.semrushApiKey) {
      try {
        metrics = await this.fetchFromSEMrush(keyword);
        if (metrics) {
          console.log(`✅ Got metrics from SEMrush`);
        }
      } catch (error) {
        console.log(`⚠️  SEMrush failed: ${error.message}`);
      }
    }

    // Try Keywords Everywhere as final backup
    if (!metrics && this.keywordsEverywhereApiKey) {
      try {
        metrics = await this.fetchFromKeywordsEverywhere(keyword);
        if (metrics) {
          console.log(`✅ Got metrics from Keywords Everywhere`);
        }
      } catch (error) {
        console.log(`⚠️  Keywords Everywhere failed: ${error.message}`);
      }
    }

    // If all APIs fail, return AI-estimated metrics
    if (!metrics) {
      console.log(`💭 Using AI-estimated metrics for: ${keyword}`);
      metrics = this.getAIEstimatedMetrics(keyword);
    }

    // Cache the result
    if (this.useCache) {
      this.cache.set(keyword, metrics);
    }

    return metrics;
  }

  /**
   * Fetch from Google Ads API (FREE - Direct integration)
   */
  async fetchFromGoogleAdsAPI(keyword) {
    try {
      const results = await this.googleAdsClient.getKeywordIdeas([keyword], this.location, this.language);

      if (results && results.length > 0) {
        // Find exact match or use first result
        const result = results.find(r => r.keyword.toLowerCase() === keyword.toLowerCase()) || results[0];
        return result;
      }

      throw new Error('No data returned from Google Ads API');
    } catch (error) {
      console.log(`⚠️  Google Ads API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch from Google Ads MCP (FREE - Official Google Keyword Planner)
   */
  async fetchFromGoogleAdsMCP(keyword) {
    if (!this.mcpClient) {
      throw new Error('MCP client not configured');
    }

    console.log(`🔍 Querying Google Ads Keyword Planner via MCP for India`);

    try {
      // Call the MCP tool for keyword planning
      const result = await this.mcpClient.callTool('run_keyword_planner', {
        keywords: [keyword],
        location: 'India', // Or location_id: 2356
        language: 'en',
        include_adult_keywords: false
      });

      if (result && result.data && result.data.length > 0) {
        const keywordData = result.data[0];

        // Extract metrics from Google Ads response
        const searchVolume = keywordData.avg_monthly_searches || 0;
        const competition = keywordData.competition || 'UNKNOWN';
        const competitionIndex = keywordData.competition_index || 0;
        const lowBid = keywordData.low_top_of_page_bid_micros ? keywordData.low_top_of_page_bid_micros / 1000000 : 0;
        const highBid = keywordData.high_top_of_page_bid_micros ? keywordData.high_top_of_page_bid_micros / 1000000 : 0;
        const cpc = (lowBid + highBid) / 2;

        // Calculate keyword difficulty from competition index (0-100)
        let difficulty = competitionIndex;
        if (!competitionIndex && competition) {
          difficulty = competition === 'HIGH' ? 70 :
                      competition === 'MEDIUM' ? 50 : 30;
        }

        return {
          keyword: keyword,
          search_volume: searchVolume,
          keyword_difficulty: difficulty,
          cpc: cpc,
          competition: competition,
          competition_index: competitionIndex,
          low_bid: lowBid,
          high_bid: highBid,
          monthly_searches: keywordData.monthly_search_volumes || [],
          source: 'Google Ads MCP',
          confidence: 'very-high', // Official Google data
          location: 'India',
          language: 'en'
        };
      }

      throw new Error('No data returned from Google Ads MCP');
    } catch (error) {
      console.log(`⚠️  Google Ads MCP error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch from DataForSEO API (Backup - Paid)
   */
  async fetchFromDataForSEO(keyword) {
    const auth = Buffer.from(`${this.dataForSEOLogin}:${this.dataForSEOPassword}`).toString('base64');

    // Use Search Volume endpoint as per documentation
    const requestBody = [{
      keywords: [keyword],
      location_code: 2356, // India
      language_code: 'en',
      search_partners: false
    }];

    console.log(`🔍 Querying DataForSEO Search Volume API for India (location: 2356)`);

    const response = await fetch(`${this.apis.dataForSEO}/keywords_data/google_ads/search_volume/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();

    // Debug: log the response
    if (data.status_code !== 20000) {
      console.log(`⚠️  DataForSEO API status: ${data.status_code} - ${data.status_message}`);
    }

    if (data.tasks && data.tasks[0]) {
      const task = data.tasks[0];

      // Check task status
      if (task.status_code === 20000 && task.result && task.result.length > 0) {
        // Find the exact keyword match in results
        const result = task.result.find(r => r.keyword && r.keyword.toLowerCase() === keyword.toLowerCase()) || task.result[0];

        // Calculate keyword difficulty from competition_index (0-100)
        let difficulty = result.competition_index || 50;

        // If competition_index not available, use competition level
        if (!result.competition_index && result.competition) {
          difficulty = result.competition === 'HIGH' ? 70 :
                      result.competition === 'MEDIUM' ? 50 : 30;
        }

        return {
          keyword: result.keyword || keyword,
          search_volume: result.search_volume || 0,
          keyword_difficulty: difficulty,
          cpc: result.cpc || 0,
          competition: result.competition || 'UNKNOWN',
          competition_index: result.competition_index || 0,
          low_bid: result.low_top_of_page_bid || 0,
          high_bid: result.high_top_of_page_bid || 0,
          monthly_searches: result.monthly_searches || [],
          source: 'DataForSEO',
          confidence: 'high',
          location: result.location_code,
          language: result.language_code
        };
      } else {
        console.log(`⚠️  DataForSEO task status: ${task.status_code} - ${task.status_message}`);
        if (!task.result || task.result.length === 0) {
          console.log(`    No results returned for keyword: ${keyword}`);
          console.log(`    This might mean: low search volume, keyword not in database, or account needs activation`);
        }
      }
    }

    throw new Error('No data returned from DataForSEO');
  }

  /**
   * Fetch from SEMrush API
   */
  async fetchFromSEMrush(keyword) {
    const params = new URLSearchParams({
      type: 'phrase_this',
      key: this.semrushApiKey,
      phrase: keyword,
      database: 'in', // India
      export_columns: 'Ph,Nq,Cp,Co,Nr,Td'
    });

    const response = await fetch(`${this.apis.semrush}/?${params}`);

    if (!response.ok) {
      throw new Error(`SEMrush API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('No data returned from SEMrush');
    }

    const headers = lines[0].split(';');
    const values = lines[1].split(';');

    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    return {
      keyword: keyword,
      search_volume: parseInt(data.Nq) || 0,
      keyword_difficulty: parseFloat(data.Td) || 50,
      cpc: parseFloat(data.Cp) || 0,
      competition: parseFloat(data.Co) || 0,
      results: parseInt(data.Nr) || 0,
      source: 'SEMrush',
      confidence: 'high'
    };
  }

  /**
   * Fetch from Keywords Everywhere API
   */
  async fetchFromKeywordsEverywhere(keyword) {
    const requestBody = {
      keywords: [keyword],
      country: 'in',
      currency: 'INR'
    };

    const response = await fetch(`${this.apis.keywordsEverywhere}/get_keyword_data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.keywordsEverywhereApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Keywords Everywhere API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data[0]) {
      const result = data.data[0];

      return {
        keyword: keyword,
        search_volume: result.vol || 0,
        keyword_difficulty: this.calculateKDFromCompetition(result.competition) || 50,
        cpc: result.cpc?.value || 0,
        competition: result.competition || 0,
        trend: result.trend || [],
        source: 'Keywords Everywhere',
        confidence: 'medium'
      };
    }

    throw new Error('No data returned from Keywords Everywhere');
  }

  /**
   * Get AI-estimated metrics (fallback when no API is available)
   */
  getAIEstimatedMetrics(keyword) {
    // Simple heuristic-based estimation
    const wordCount = keyword.split(' ').length;
    const hasNumbers = /\d/.test(keyword);
    const hasLocation = /(india|indian|mumbai|delhi|bangalore)/i.test(keyword);

    // Estimate search volume based on keyword characteristics
    let estimatedVolume = 5000;
    if (wordCount <= 2) estimatedVolume = 12000;
    if (wordCount === 3) estimatedVolume = 8000;
    if (wordCount >= 4) estimatedVolume = 3000;
    if (hasNumbers) estimatedVolume *= 0.7;
    if (hasLocation) estimatedVolume *= 1.2;

    // Estimate difficulty based on keyword characteristics
    let estimatedDifficulty = 40;
    if (wordCount <= 2) estimatedDifficulty = 65;
    if (wordCount === 3) estimatedDifficulty = 45;
    if (wordCount >= 4) estimatedDifficulty = 25;

    return {
      keyword: keyword,
      search_volume: Math.round(estimatedVolume),
      keyword_difficulty: Math.round(estimatedDifficulty),
      cpc: 0,
      competition: 0.5,
      source: 'AI-Estimated',
      confidence: 'low',
      note: 'Configure SEO API credentials for accurate data'
    };
  }

  /**
   * Calculate keyword difficulty from competition score
   */
  calculateKDFromCompetition(competition) {
    // Convert 0-1 competition score to 0-100 difficulty score
    return Math.round(competition * 100);
  }

  /**
   * Batch fetch multiple keywords
   */
  async batchFetchKeywords(keywords) {
    console.log(`\n📊 Fetching SEO metrics for ${keywords.length} keywords...`);

    const results = [];
    const batchSize = 5; // Process 5 at a time to respect rate limits

    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);

      const batchPromises = batch.map(keyword =>
        this.fetchKeywordMetrics(keyword).catch(error => {
          console.log(`⚠️  Failed to fetch ${keyword}: ${error.message}`);
          return this.getAIEstimatedMetrics(keyword);
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay
      if (i + batchSize < keywords.length) {
        await this.sleep(1000); // 1 second delay between batches
      }
    }

    console.log(`✅ Fetched metrics for ${results.length} keywords\n`);
    return results;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Display metrics summary
   */
  displayMetricsSummary(metrics) {
    console.log('\n📊 SEO METRICS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Keyword: ${metrics.keyword}`);
    console.log(`Search Volume: ${metrics.search_volume.toLocaleString()}/month`);
    console.log(`Keyword Difficulty: ${metrics.keyword_difficulty}/100`);
    console.log(`CPC: ₹${metrics.cpc.toFixed(2)}`);
    console.log(`Competition: ${(metrics.competition * 100).toFixed(0)}%`);
    console.log(`Data Source: ${metrics.source}`);
    console.log(`Confidence: ${metrics.confidence}`);
    console.log('='.repeat(80));
  }

  /**
   * Get content gaps from Google Search Console
   */
  async getContentGapsFromGSC(options = {}) {
    if (!this.useGSCAPI || !this.gscClient) {
      throw new Error('GSC API not configured');
    }

    console.log('🔍 Fetching content gap opportunities from Google Search Console...');
    return this.gscClient.getContentGaps(options);
  }

  /**
   * Get content gaps from Google Analytics 4 (alternative to GSC)
   */
  async getContentGapsFromGA4(options = {}) {
    if (!this.useGA4API || !this.ga4Client) {
      throw new Error('GA4 API not configured');
    }

    console.log('🔍 Fetching content improvement opportunities from Google Analytics 4...');
    return this.ga4Client.getContentGapsFromGA4(options);
  }

  /**
   * Get content gaps (tries GSC first, falls back to GA4)
   */
  async getContentGaps(options = {}) {
    // Try GSC first
    if (this.useGSCAPI && this.gscClient) {
      try {
        return await this.getContentGapsFromGSC(options);
      } catch (error) {
        console.log(`⚠️  GSC not available: ${error.message}`);
        console.log('💡 Falling back to GA4...');
      }
    }

    // Fall back to GA4
    if (this.useGA4API && this.ga4Client) {
      try {
        return await this.getContentGapsFromGA4(options);
      } catch (error) {
        console.log(`⚠️  GA4 not available: ${error.message}`);
      }
    }

    throw new Error('No traffic analysis API available (need GSC or GA4)');
  }

  /**
   * Analyze topic coverage using Custom Search
   */
  async analyzeTopicCoverage(topic, keywords = []) {
    if (!this.useCSEAPI || !this.cseClient) {
      throw new Error('CSE API not configured');
    }

    console.log(`🔍 Analyzing topic coverage for: ${topic}`);
    return this.cseClient.analyzeTopicCoverage(topic, keywords);
  }

  /**
   * Get all GSC content gaps and enrich with keyword metrics
   */
  async getEnrichedContentGaps(options = {}) {
    try {
      // Get content gaps from GSC
      const gaps = await this.getContentGapsFromGSC(options);

      console.log(`📊 Enriching ${gaps.length} content gaps with keyword metrics...`);

      // Enrich each gap with keyword metrics
      const enrichedGaps = [];
      for (const gap of gaps.slice(0, options.limit || 10)) {
        try {
          const metrics = await this.fetchKeywordMetrics(gap.query);

          enrichedGaps.push({
            ...gap,
            keyword_difficulty: metrics.keyword_difficulty,
            search_volume: metrics.search_volume,
            cpc: metrics.cpc,
            competition: metrics.competition,
            data_source: metrics.source
          });

          // Rate limiting
          await this.sleep(500);
        } catch (error) {
          console.log(`⚠️  Failed to enrich "${gap.query}": ${error.message}`);
          enrichedGaps.push(gap);
        }
      }

      console.log(`✅ Enriched ${enrichedGaps.length} content gaps`);
      return enrichedGaps;
    } catch (error) {
      console.error('❌ Failed to get enriched content gaps:', error.message);
      throw error;
    }
  }

  /**
   * Comprehensive content gap analysis combining GSC + Google Ads + CSE
   */
  async comprehensiveContentGapAnalysis(options = {}) {
    console.log('\n🔍 STARTING COMPREHENSIVE CONTENT GAP ANALYSIS');
    console.log('='.repeat(80));

    const results = {
      gsc_gaps: [],
      enriched_gaps: [],
      coverage_analysis: [],
      recommendations: []
    };

    try {
      // Step 1: Get content gaps (GSC or GA4)
      console.log('\n📊 Step 1: Fetching content gap opportunities...');
      try {
        results.gsc_gaps = await this.getContentGaps({
          days: options.days || 30,
          limit: options.limit || 20,
          minSessions: 10,
          minBounceRate: 0.06 // 6%+ for GA4
        });
        console.log(`✅ Found ${results.gsc_gaps.length} content gap opportunities`);
      } catch (error) {
        console.log(`⚠️  No traffic analysis available: ${error.message}`);
      }

      // Step 2: Enrich with Google Ads keyword data
      if (results.gsc_gaps.length > 0 && (this.useGoogleAdsAPI || this.useGoogleAdsMCP)) {
        console.log('\n📊 Step 2: Enriching with Google Ads keyword metrics...');
        results.enriched_gaps = await this.getEnrichedContentGaps({
          limit: options.limit || 10
        });
      }

      // Step 3: Check coverage using CSE
      if (this.useCSEAPI && this.cseClient && results.enriched_gaps.length > 0) {
        console.log('\n📊 Step 3: Analyzing topic coverage with Custom Search...');

        for (const gap of results.enriched_gaps.slice(0, 5)) {
          try {
            const coverage = await this.analyzeTopicCoverage(gap.query, []);
            results.coverage_analysis.push(coverage);

            // Rate limiting for CSE API (100 queries/day limit)
            await this.sleep(2000);
          } catch (error) {
            console.log(`⚠️  Coverage analysis failed for "${gap.query}": ${error.message}`);
          }
        }
      }

      // Step 4: Generate recommendations
      console.log('\n📊 Step 4: Generating content recommendations...');
      results.recommendations = results.enriched_gaps.map((gap, index) => {
        const coverage = results.coverage_analysis.find(c => c.topic === gap.query);

        return {
          rank: index + 1,
          keyword: gap.query,
          search_volume: gap.search_volume || 0,
          keyword_difficulty: gap.keyword_difficulty || 50,
          current_impressions: gap.impressions,
          current_clicks: gap.clicks,
          current_ctr: gap.ctr,
          current_position: gap.position,
          potential_traffic_gain: gap.trafficGain,
          opportunity_score: gap.opportunityScore,
          coverage_score: coverage?.coverageScore || 0,
          recommendation: coverage?.recommendation?.action || 'create',
          existing_content: coverage?.existingArticles?.length || 0,
          priority: this.calculatePriority(gap, coverage)
        };
      });

      // Sort by priority
      results.recommendations.sort((a, b) => b.priority - a.priority);

      console.log('\n✅ COMPREHENSIVE ANALYSIS COMPLETE');
      console.log('='.repeat(80));
      console.log(`📊 Total Recommendations: ${results.recommendations.length}`);
      console.log(`🎯 High Priority: ${results.recommendations.filter(r => r.priority >= 80).length}`);
      console.log(`📈 Medium Priority: ${results.recommendations.filter(r => r.priority >= 50 && r.priority < 80).length}`);
      console.log(`📉 Low Priority: ${results.recommendations.filter(r => r.priority < 50).length}`);

      return results;
    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Calculate overall priority score
   */
  calculatePriority(gap, coverage) {
    // Factors:
    // 1. Opportunity score from GSC (40%)
    // 2. Traffic gain potential (30%)
    // 3. Coverage gap (20%)
    // 4. Keyword difficulty (10% - easier = higher priority)

    const opportunityScore = (gap.opportunityScore || 50) * 0.4;
    const trafficScore = Math.min((gap.trafficGain || 0) / 20, 30);
    const coverageScore = coverage ? (100 - coverage.coverageScore) * 0.2 : 20;
    const difficultyScore = Math.max(0, 10 - ((gap.keyword_difficulty || 50) / 10));

    return Math.round(opportunityScore + trafficScore + coverageScore + difficultyScore);
  }
}

module.exports = SEODataFetcher;

// CLI usage
if (require.main === module) {
  const keyword = process.argv[2] || 'index funds vs mutual funds';

  const fetcher = new SEODataFetcher();

  if (!fetcher.validateCredentials()) {
    console.log('\n💡 Testing with AI-estimated metrics...\n');
  }

  fetcher.fetchKeywordMetrics(keyword)
    .then(metrics => {
      fetcher.displayMetricsSummary(metrics);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
    });
}

