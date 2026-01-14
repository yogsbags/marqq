#!/usr/bin/env node

/**
 * Google Custom Search API Direct Client
 * Direct integration with Google Custom Search JSON API
 *
 * Setup:
 * 1. Get API key: https://console.cloud.google.com/apis/credentials
 * 2. Enable Custom Search API: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
 * 3. Create Custom Search Engine: https://programmablesearchengine.google.com/
 * 4. Set environment variables:
 *    - GOOGLE_CSE_API_KEY="your-api-key"
 *    - GOOGLE_CSE_ENGINE_ID="your-engine-id"
 *
 * Pricing: 100 queries/day FREE, then $5 per 1000 queries
 */

const fetch = require('node-fetch');

class GoogleCustomSearchAPIClient {
  constructor(config = {}) {
    // API credentials
    this.apiKey = config.apiKey || process.env.GOOGLE_CSE_API_KEY || process.env.API_KEY;
    this.engineId = config.engineId || process.env.GOOGLE_CSE_ENGINE_ID || process.env.ENGINE_ID;

    // API configuration
    this.apiUrl = 'https://www.googleapis.com/customsearch/v1';
    this.siteUrl = config.siteUrl || 'plindia.com';

    // Rate limiting
    this.requestCount = 0;
    this.dailyLimit = 100; // FREE tier limit

    console.log(`🔌 Google Custom Search API client initialized for ${this.siteUrl}`);
  }

  /**
   * Validate credentials
   */
  validateCredentials() {
    if (!this.apiKey) {
      console.warn('⚠️  GOOGLE_CSE_API_KEY not set');
      console.log('💡 Get API key from: https://console.cloud.google.com/apis/credentials');
      return false;
    }

    if (!this.engineId) {
      console.warn('⚠️  GOOGLE_CSE_ENGINE_ID not set');
      console.log('💡 Create search engine at: https://programmablesearchengine.google.com/');
      return false;
    }

    console.log('✅ Google Custom Search API credentials validated');
    return true;
  }

  /**
   * Check rate limit
   */
  checkRateLimit() {
    if (this.requestCount >= this.dailyLimit) {
      console.warn(`⚠️  Daily rate limit reached (${this.dailyLimit} queries)`);
      console.log('💡 Upgrade to paid tier for more queries: https://developers.google.com/custom-search/v1/overview');
      return false;
    }
    return true;
  }

  /**
   * Perform a custom search
   * @param {string} query - Search query
   * @param {object} options - Search options
   */
  async search(query, options = {}) {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.engineId,
        q: query,
        num: options.num || 10,
        start: options.start || 1
      });

      // Add site search if specified
      if (options.siteSearch || this.siteUrl) {
        params.append('siteSearch', options.siteSearch || this.siteUrl);
        params.append('siteSearchFilter', 'i'); // Include site search
      }

      // Add date restrict if specified
      if (options.dateRestrict) {
        params.append('dateRestrict', options.dateRestrict); // e.g., 'd30' for last 30 days
      }

      console.log(`🔍 Searching: "${query}" on ${options.siteSearch || this.siteUrl}`);

      const response = await fetch(`${this.apiUrl}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`CSE API error: ${data.error?.message || 'Unknown error'}`);
      }

      this.requestCount++;

      const results = (data.items || []).map(item => this.processSearchResult(item));

      console.log(`✅ Got ${results.length} search results (${this.requestCount}/${this.dailyLimit} queries today)`);
      return {
        results,
        totalResults: parseInt(data.searchInformation?.totalResults || 0),
        searchTime: parseFloat(data.searchInformation?.searchTime || 0)
      };

    } catch (error) {
      console.error('❌ CSE API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Process search result
   */
  processSearchResult(item) {
    return {
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      htmlSnippet: item.htmlSnippet,
      formattedUrl: item.formattedUrl
    };
  }

  /**
   * Analyze topic coverage on site
   * @param {string} topic - Topic to analyze
   * @param {Array<string>} keywords - Related keywords
   */
  async analyzeTopicCoverage(topic, keywords = []) {
    console.log(`📊 Analyzing topic coverage: "${topic}"`);

    // Search for exact topic
    const topicResults = await this.search(topic, {
      siteSearch: this.siteUrl,
      num: 10
    });

    // Search for related keywords
    const keywordResults = [];
    for (const keyword of keywords.slice(0, 5)) { // Limit to avoid rate limits
      try {
        const results = await this.search(keyword, {
          siteSearch: this.siteUrl,
          num: 5
        });
        keywordResults.push(...results.results);

        // Rate limiting: Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`⚠️  Failed to search keyword "${keyword}":`, error.message);
      }
    }

    // Deduplicate results by URL
    const allResults = [...topicResults.results, ...keywordResults];
    const uniqueResults = Array.from(
      new Map(allResults.map(r => [r.link, r])).values()
    );

    // Calculate coverage score
    const coverageScore = this.calculateCoverageScore(topic, keywords, uniqueResults);

    console.log(`✅ Coverage analysis complete: ${coverageScore}/100`);

    return {
      topic,
      keywords,
      coverageScore,
      existingArticles: uniqueResults,
      totalResults: topicResults.totalResults,
      recommendation: this.getRecommendation(coverageScore)
    };
  }

  /**
   * Calculate coverage score (0-100)
   */
  calculateCoverageScore(topic, keywords, results) {
    if (results.length === 0) {
      return 0;
    }

    // Factors:
    // 1. Number of existing articles (40%)
    // 2. Keyword coverage (40%)
    // 3. Content quality indicators (20%)

    // Article count score
    const articleScore = Math.min(results.length * 10, 40);

    // Keyword coverage score
    const keywordsCovered = keywords.filter(kw =>
      results.some(r =>
        r.title.toLowerCase().includes(kw.toLowerCase()) ||
        r.snippet.toLowerCase().includes(kw.toLowerCase())
      )
    ).length;
    const keywordScore = keywords.length > 0
      ? (keywordsCovered / keywords.length) * 40
      : 20;

    // Quality score (based on snippet length and title quality)
    const avgSnippetLength = results.reduce((sum, r) => sum + r.snippet.length, 0) / results.length;
    const qualityScore = Math.min((avgSnippetLength / 20), 20);

    return Math.round(articleScore + keywordScore + qualityScore);
  }

  /**
   * Get recommendation based on coverage score
   */
  getRecommendation(coverageScore) {
    if (coverageScore < 30) {
      return {
        action: 'create',
        reason: 'Low coverage - create new comprehensive content'
      };
    } else if (coverageScore < 70) {
      return {
        action: 'update',
        reason: 'Medium coverage - update and expand existing content'
      };
    } else {
      return {
        action: 'skip',
        reason: 'High coverage - topic already well-covered'
      };
    }
  }

  /**
   * Find competitor content
   * @param {string} topic - Topic to search
   * @param {Array<string>} competitors - List of competitor domains
   */
  async findCompetitorContent(topic, competitors = []) {
    console.log(`🔍 Finding competitor content for: "${topic}"`);

    const competitorContent = [];

    for (const competitor of competitors) {
      try {
        const results = await this.search(topic, {
          siteSearch: competitor,
          num: 5
        });

        competitorContent.push({
          competitor,
          articles: results.results,
          totalResults: results.totalResults
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`⚠️  Failed to search ${competitor}:`, error.message);
      }
    }

    console.log(`✅ Found competitor content from ${competitorContent.length} competitors`);
    return competitorContent;
  }

  /**
   * Search recent content (last 30 days)
   */
  async searchRecentContent(query, days = 30) {
    return this.search(query, {
      siteSearch: this.siteUrl,
      dateRestrict: `d${days}`,
      num: 10
    });
  }

  /**
   * Get all indexed pages for a specific path
   */
  async getIndexedPages(path = '') {
    const query = path ? `site:${this.siteUrl}${path}` : `site:${this.siteUrl}`;

    return this.search(query, {
      siteSearch: null, // Don't restrict to site search
      num: 10
    });
  }
}

module.exports = GoogleCustomSearchAPIClient;

// CLI testing
if (require.main === module) {
  const client = new GoogleCustomSearchAPIClient();

  if (!client.validateCredentials()) {
    console.log('\n❌ Missing credentials. Set environment variables:');
    console.log('   export GOOGLE_CSE_API_KEY="your-api-key"');
    console.log('   export GOOGLE_CSE_ENGINE_ID="your-engine-id"');
    console.log('\n📚 Setup guide: https://developers.google.com/custom-search/v1/overview');
    process.exit(1);
  }

  // Test: Analyze topic coverage
  const topic = process.argv[2] || 'mutual funds for beginners';
  const keywords = ['SIP', 'investment strategy', 'portfolio allocation'];

  client.analyzeTopicCoverage(topic, keywords)
    .then(coverage => {
      console.log('\n📊 TOPIC COVERAGE ANALYSIS:');
      console.log('='.repeat(80));
      console.log(`\nTopic: ${coverage.topic}`);
      console.log(`Coverage Score: ${coverage.coverageScore}/100`);
      console.log(`Total Results: ${coverage.totalResults}`);
      console.log(`\nRecommendation: ${coverage.recommendation.action.toUpperCase()}`);
      console.log(`Reason: ${coverage.recommendation.reason}`);

      if (coverage.existingArticles.length > 0) {
        console.log(`\nExisting Articles:`);
        coverage.existingArticles.slice(0, 5).forEach((article, index) => {
          console.log(`\n${index + 1}. ${article.title}`);
          console.log(`   URL: ${article.link}`);
          console.log(`   Snippet: ${article.snippet.substring(0, 100)}...`);
        });
      }

      console.log('\n' + '='.repeat(80));
      console.log('✅ Test completed successfully!');
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}
