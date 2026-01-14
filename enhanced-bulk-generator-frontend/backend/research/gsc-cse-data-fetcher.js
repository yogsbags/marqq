#!/usr/bin/env node

/**
 * Google Search Console & Custom Search Engine Data Fetcher
 * Integrates GSC and CSE MCP tools for real performance data
 * 
 * GSC Tools Available:
 * - list_sites: List verified sites
 * - search_analytics: Get search performance data
 * - index_inspect: Check index status
 * - list_sitemaps: List submitted sitemaps
 * - get_sitemap: Get sitemap details
 * - submit_sitemap: Submit new sitemap
 * 
 * CSE Tools Available:
 * - google_search: Search plindia.com content
 */

class GSCCSEDataFetcher {
  constructor(config = {}) {
    // MCP Integration
    this.gscClient = config.gscClient || null;
    this.cseClient = config.cseClient || null;
    this.useGSC = config.useGSC !== false;
    this.useCSE = config.useCSE !== false;
    
    // Site configuration
    this.siteUrl = config.siteUrl || 'https://plindia.com';
    this.dateRange = config.dateRange || 'last_30_days'; // last_7_days, last_30_days, last_3_months
    
    // Cache
    this.useCache = config.useCache !== false;
    this.cache = new Map();
    
    console.log(`✅ GSC/CSE Data Fetcher initialized for ${this.siteUrl}`);
  }

  /**
   * Validate MCP clients availability
   */
  validateClients() {
    const available = [];
    
    if (this.useGSC && this.gscClient) {
      available.push('Google Search Console (GSC)');
    }
    if (this.useCSE && this.cseClient) {
      available.push('Google Custom Search Engine (CSE)');
    }
    
    if (available.length === 0) {
      console.warn('⚠️  No GSC/CSE clients configured!');
      console.log('💡 Enable in Cursor MCP settings:');
      console.log('   - gsc-mcp: Search Console data');
      console.log('   - google-cse-mcp: Custom Search Engine');
      return false;
    }
    
    console.log(`✅ Data Sources: ${available.join(', ')}`);
    return true;
  }

  /**
   * ========================================
   * GOOGLE SEARCH CONSOLE (GSC) METHODS
   * ========================================
   */

  /**
   * Get top-performing keywords from GSC
   * Returns actual queries driving traffic to plindia.com
   */
  async getTopPerformingKeywords(options = {}) {
    if (!this.gscClient) {
      throw new Error('GSC client not configured');
    }

    const cacheKey = `gsc_top_keywords_${this.dateRange}`;
    if (this.useCache && this.cache.has(cacheKey)) {
      console.log('📦 Using cached GSC top keywords');
      return this.cache.get(cacheKey);
    }

    console.log(`🔍 Fetching top-performing keywords from GSC (${this.dateRange})...`);

    try {
      const result = await this.gscClient.callTool('search_analytics', {
        site_url: this.siteUrl,
        start_date: this.getStartDate(),
        end_date: this.getEndDate(),
        dimensions: ['query'],
        row_limit: options.limit || 100,
        search_type: 'web'
      });

      if (result && result.rows) {
        const keywords = result.rows.map(row => ({
          keyword: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
          source: 'Google Search Console',
          confidence: 'very-high' // Real data!
        }));

        // Cache the result
        if (this.useCache) {
          this.cache.set(cacheKey, keywords);
        }

        console.log(`✅ Found ${keywords.length} keywords from GSC`);
        return keywords;
      }

      throw new Error('No GSC data returned');
    } catch (error) {
      console.error(`❌ GSC fetch failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get content gaps from GSC
   * Identifies queries with high impressions but low CTR (opportunity!)
   */
  async getContentGaps(options = {}) {
    if (!this.gscClient) {
      throw new Error('GSC client not configured');
    }

    console.log('🔍 Analyzing GSC data for content gaps...');

    try {
      const allQueries = await this.getTopPerformingKeywords({ limit: 500 });

      // Filter for high impressions + low CTR = content gap opportunity
      const gaps = allQueries.filter(q => {
        const highImpressions = q.impressions > (options.minImpressions || 100);
        const lowCTR = q.ctr < (options.maxCTR || 0.02); // Less than 2% CTR
        const poorRanking = q.position > (options.minPosition || 10); // Not in top 10
        
        return highImpressions && (lowCTR || poorRanking);
      });

      // Sort by opportunity score (impressions × potential CTR gain)
      gaps.sort((a, b) => {
        const scoreA = a.impressions * (0.20 - a.ctr); // Potential to reach 20% CTR
        const scoreB = b.impressions * (0.20 - b.ctr);
        return scoreB - scoreA;
      });

      console.log(`✅ Found ${gaps.length} content gap opportunities from GSC`);
      
      return gaps.map(gap => ({
        ...gap,
        opportunityScore: Math.round(gap.impressions * (0.20 - gap.ctr)),
        currentTraffic: gap.clicks,
        potentialTraffic: Math.round(gap.impressions * 0.20), // If we improve to 20% CTR
        trafficGain: Math.round(gap.impressions * 0.20) - gap.clicks
      }));
    } catch (error) {
      console.error(`❌ Content gap analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pages with declining performance
   * Identifies content that needs updating/refreshing
   */
  async getDecliningPages(options = {}) {
    if (!this.gscClient) {
      throw new Error('GSC client not configured');
    }

    console.log('🔍 Identifying pages with declining performance...');

    try {
      // Get page performance data
      const result = await this.gscClient.callTool('search_analytics', {
        site_url: this.siteUrl,
        start_date: this.getStartDate(),
        end_date: this.getEndDate(),
        dimensions: ['page'],
        row_limit: options.limit || 100,
        search_type: 'web'
      });

      if (result && result.rows) {
        // Filter for pages with poor performance indicators
        const declining = result.rows
          .filter(row => {
            const clicks = row.clicks || 0;
            const position = row.position || 0;
            const ctr = row.ctr || 0;
            
            return position > 15 || ctr < 0.01; // Position worse than 15 or CTR < 1%
          })
          .map(row => ({
            url: row.keys[0],
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
            needsUpdate: true,
            priority: row.impressions > 1000 ? 'high' : row.impressions > 100 ? 'medium' : 'low'
          }));

        console.log(`✅ Found ${declining.length} pages needing updates`);
        return declining;
      }

      return [];
    } catch (error) {
      console.error(`❌ Declining pages analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get index status for URLs
   */
  async getIndexStatus(urls) {
    if (!this.gscClient) {
      throw new Error('GSC client not configured');
    }

    console.log(`🔍 Checking index status for ${urls.length} URLs...`);

    const results = [];
    for (const url of urls) {
      try {
        const result = await this.gscClient.callTool('index_inspect', {
          site_url: this.siteUrl,
          inspection_url: url
        });

        results.push({
          url: url,
          indexed: result.index_status_result?.coverage_state === 'Submitted and indexed',
          coverageState: result.index_status_result?.coverage_state || 'Unknown',
          lastCrawled: result.index_status_result?.last_crawl_time || null
        });
      } catch (error) {
        console.error(`⚠️  Failed to inspect ${url}: ${error.message}`);
        results.push({
          url: url,
          indexed: false,
          error: error.message
        });
      }

      // Rate limiting delay
      await this.sleep(1000);
    }

    console.log(`✅ Inspected ${results.length} URLs`);
    return results;
  }

  /**
   * ========================================
   * GOOGLE CUSTOM SEARCH ENGINE (CSE) METHODS
   * ========================================
   */

  /**
   * Search plindia.com for existing content on a topic
   * Helps identify what content already exists
   */
  async searchSiteContent(query, options = {}) {
    if (!this.cseClient) {
      throw new Error('CSE client not configured');
    }

    console.log(`🔍 Searching plindia.com for: "${query}"`);

    try {
      const result = await this.cseClient.callTool('google_search', {
        query: `site:plindia.com ${query}`,
        num: options.limit || 10
      });

      if (result && result.items) {
        const existingContent = result.items.map(item => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          relevanceScore: this.calculateRelevance(query, item.title, item.snippet)
        }));

        console.log(`✅ Found ${existingContent.length} existing articles on plindia.com`);
        return existingContent;
      }

      console.log('✅ No existing content found - new opportunity!');
      return [];
    } catch (error) {
      console.error(`❌ CSE search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if topic has existing coverage
   * Returns coverage analysis
   */
  async analyzeTopicCoverage(topic, keywords) {
    if (!this.cseClient) {
      throw new Error('CSE client not configured');
    }

    console.log(`🔍 Analyzing topic coverage for: "${topic}"`);

    const coverage = {
      topic: topic,
      hasExistingContent: false,
      existingArticles: [],
      keywordsCovered: [],
      keywordsMissing: [],
      coverageScore: 0,
      recommendation: 'create' // create, update, skip
    };

    try {
      // Search for existing content
      const existing = await this.searchSiteContent(topic, { limit: 5 });
      coverage.existingArticles = existing;
      coverage.hasExistingContent = existing.length > 0;

      // Check which keywords are covered
      for (const keyword of keywords) {
        const keywordContent = await this.searchSiteContent(keyword, { limit: 3 });
        
        if (keywordContent.length > 0) {
          coverage.keywordsCovered.push({
            keyword: keyword,
            articles: keywordContent
          });
        } else {
          coverage.keywordsMissing.push(keyword);
        }

        // Rate limiting
        await this.sleep(500);
      }

      // Calculate coverage score
      coverage.coverageScore = Math.round(
        (coverage.keywordsCovered.length / keywords.length) * 100
      );

      // Recommendation
      if (coverage.coverageScore === 0) {
        coverage.recommendation = 'create'; // No content exists
      } else if (coverage.coverageScore < 50) {
        coverage.recommendation = 'create'; // Low coverage - new content needed
      } else if (coverage.coverageScore < 80) {
        coverage.recommendation = 'update'; // Medium coverage - update existing
      } else {
        coverage.recommendation = 'skip'; // High coverage - content exists
      }

      console.log(`✅ Coverage: ${coverage.coverageScore}% | Recommendation: ${coverage.recommendation.toUpperCase()}`);
      return coverage;
    } catch (error) {
      console.error(`❌ Coverage analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ========================================
   * UTILITY METHODS
   * ========================================
   */

  /**
   * Get start date based on date range
   */
  getStartDate() {
    const now = new Date();
    const daysAgo = {
      'last_7_days': 7,
      'last_30_days': 30,
      'last_3_months': 90
    }[this.dateRange] || 30;

    now.setDate(now.getDate() - daysAgo);
    return now.toISOString().split('T')[0];
  }

  /**
   * Get end date (today)
   */
  getEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculate relevance score between query and content
   */
  calculateRelevance(query, title, snippet) {
    const queryWords = query.toLowerCase().split(' ');
    const content = `${title} ${snippet}`.toLowerCase();
    
    let matches = 0;
    for (const word of queryWords) {
      if (content.includes(word)) {
        matches++;
      }
    }
    
    return Math.round((matches / queryWords.length) * 100);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Display GSC keyword summary
   */
  displayGSCKeywordsSummary(keywords) {
    console.log('\n📊 GSC TOP KEYWORDS SUMMARY');
    console.log('='.repeat(80));
    
    const top10 = keywords.slice(0, 10);
    
    for (const [index, kw] of top10.entries()) {
      console.log(`\n${index + 1}. "${kw.keyword}"`);
      console.log(`   Clicks: ${kw.clicks.toLocaleString()} | Impressions: ${kw.impressions.toLocaleString()}`);
      console.log(`   CTR: ${(kw.ctr * 100).toFixed(2)}% | Position: ${kw.position.toFixed(1)}`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    const totalClicks = keywords.reduce((sum, kw) => sum + kw.clicks, 0);
    const totalImpressions = keywords.reduce((sum, kw) => sum + kw.impressions, 0);
    const avgCTR = totalClicks / totalImpressions;
    
    console.log(`Total Keywords: ${keywords.length}`);
    console.log(`Total Clicks: ${totalClicks.toLocaleString()}`);
    console.log(`Total Impressions: ${totalImpressions.toLocaleString()}`);
    console.log(`Average CTR: ${(avgCTR * 100).toFixed(2)}%`);
    console.log('='.repeat(80));
  }

  /**
   * Display content gaps summary
   */
  displayContentGapsSummary(gaps) {
    console.log('\n📊 CONTENT GAP OPPORTUNITIES');
    console.log('='.repeat(80));
    
    const top10 = gaps.slice(0, 10);
    
    for (const [index, gap] of top10.entries()) {
      console.log(`\n${index + 1}. "${gap.keyword}" (Opportunity Score: ${gap.opportunityScore})`);
      console.log(`   Current: ${gap.currentTraffic} clicks | Potential: ${gap.potentialTraffic} clicks`);
      console.log(`   Traffic Gain: +${gap.trafficGain} clicks/month`);
      console.log(`   CTR: ${(gap.ctr * 100).toFixed(2)}% | Position: ${gap.position.toFixed(1)}`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    const totalPotentialGain = gaps.reduce((sum, gap) => sum + gap.trafficGain, 0);
    console.log(`Total Opportunities: ${gaps.length}`);
    console.log(`Potential Traffic Gain: +${totalPotentialGain.toLocaleString()} clicks/month`);
    console.log('='.repeat(80));
  }
}

module.exports = GSCCSEDataFetcher;

// CLI usage
if (require.main === module) {
  // This would require actual MCP clients
  console.log('✅ GSC/CSE Data Fetcher module loaded');
  console.log('\n💡 Available methods:');
  console.log('   - getTopPerformingKeywords(): Get real keywords from GSC');
  console.log('   - getContentGaps(): Find high-opportunity keywords');
  console.log('   - getDecliningPages(): Identify content needing updates');
  console.log('   - searchSiteContent(): Search existing plindia.com content');
  console.log('   - analyzeTopicCoverage(): Check if topic is already covered');
  console.log('\n📚 Use this module in workflow components for real data!');
}

