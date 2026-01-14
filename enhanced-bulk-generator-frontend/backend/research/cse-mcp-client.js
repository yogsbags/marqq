#!/usr/bin/env node

/**
 * Google Custom Search Engine MCP Client
 * Wrapper for CSE MCP tools integration
 * 
 * Available Tools:
 * - google_search: Search plindia.com or web
 */

class CSEMCPClient {
  constructor(config = {}) {
    this.toolsAvailable = false;
    this.customSearchEngineId = config.cseId || null;
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the MCP client
   */
  async initialize() {
    try {
      console.log('🔌 Initializing Google Custom Search Engine MCP client...');
      
      // In Cursor, this connects to the MCP server
      this.toolsAvailable = true;
      
      console.log('✅ CSE MCP client initialized');
      return true;
    } catch (error) {
      console.log(`⚠️  CSE MCP initialization failed: ${error.message}`);
      this.toolsAvailable = false;
      return false;
    }
  }

  /**
   * Ensure initialized before making calls
   */
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName, params) {
    await this.ensureInitialized();

    if (!this.toolsAvailable) {
      throw new Error('CSE MCP tools not available. Enable google-cse-mcp in Cursor settings.');
    }

    console.log(`📞 Calling CSE MCP tool: ${toolName}`);
    console.log(`   Parameters:`, JSON.stringify(params, null, 2));

    // In standalone mode, throw error
    throw new Error(`MCP tool calling not yet implemented in standalone mode. Use Cursor's MCP integration.`);
  }

  /**
   * Perform a Google search
   */
  async googleSearch(query, options = {}) {
    return this.callTool('google_search', {
      query: query,
      num: options.num || 10,          // Number of results (max 10)
      start: options.start || 1,        // Starting index
      cx: options.cx || this.customSearchEngineId,  // Custom Search Engine ID
      gl: options.gl || 'in',           // Geolocation (India)
      hl: options.hl || 'en',           // Interface language
      safe: options.safe || 'off',      // Safe search
      siteSearch: options.siteSearch,   // Site to search
      siteSearchFilter: options.siteSearchFilter || 'i'  // Include (i) or exclude (e)
    });
  }

  /**
   * Search specific site (e.g., plindia.com)
   */
  async searchSite(site, query, options = {}) {
    return this.googleSearch(`site:${site} ${query}`, options);
  }

  /**
   * Search for exact phrase
   */
  async searchExactPhrase(phrase, options = {}) {
    return this.googleSearch(`"${phrase}"`, options);
  }

  /**
   * Search excluding terms
   */
  async searchExcluding(query, excludeTerms, options = {}) {
    const excludeQuery = excludeTerms.map(term => `-${term}`).join(' ');
    return this.googleSearch(`${query} ${excludeQuery}`, options);
  }

  /**
   * Check if available
   */
  isAvailable() {
    return this.toolsAvailable;
  }
}

module.exports = CSEMCPClient;

// CLI usage
if (require.main === module) {
  const client = new CSEMCPClient();

  (async () => {
    try {
      await client.ensureInitialized();
      
      if (client.isAvailable()) {
        console.log('\n✅ CSE MCP client is ready!');
        console.log('\n📋 Available tools:');
        console.log('   - google_search: Perform Google searches');
        console.log('   - searchSite: Search specific site (e.g., plindia.com)');
        console.log('   - searchExactPhrase: Search for exact phrase matches');
      } else {
        console.log('\n⚠️  CSE MCP client not available');
        console.log('Enable google-cse-mcp in Cursor settings.');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  })();
}

