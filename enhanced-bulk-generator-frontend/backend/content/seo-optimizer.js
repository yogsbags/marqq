#!/usr/bin/env node

/**
 * SEO Optimizer for Enhanced Bulk Generator
 * Refines metadata, structured data, and publication readiness
 */

const CSVDataManager = require('../core/csv-data-manager');

class SEOOptimizer {
  constructor(config = {}) {
    this.csvManager = new CSVDataManager();
    this.autoApprove = config.autoApprove || false;
  }

  /**
   * Optimize all content pending SEO review
   */
  async optimize() {
    console.log('\n🔧 SEO OPTIMIZATION STARTED');
    console.log('='.repeat(60));

    const pendingContent = this.csvManager.getContentByApprovalStatus(['Needs-SEO', 'Pending']);

    if (pendingContent.length === 0) {
      console.log('⚠️  No content awaiting SEO optimization. Approve content from Stage 4 first.');
      return [];
    }

    const optimized = pendingContent.map(item => this.optimizeContentItem(item)).filter(Boolean);

    optimized.forEach(record => {
      const qualityMetrics = record.quality_metrics;
      const seoMetadata = record.seo_metadata;

      this.csvManager.updateCreatedContent(record.content_id, {
        seo_metadata: seoMetadata,
        quality_metrics: qualityMetrics,
        approval_status: this.autoApprove ? 'SEO-Ready' : 'Pending Review'
      });
    });

    console.log(`\n✅ Optimized ${optimized.length} content items for SEO`);

    if (!this.autoApprove) {
      console.log('\n⏳ Next Steps:');
      console.log('   1. Review created-content.csv for SEO metadata');
      console.log('   2. Set approval_status = "SEO-Ready" when satisfied');
      console.log('   3. Run Stage 6: Publication');
    } else {
      console.log('🤖 Auto-approval enabled: Content marked as SEO-Ready');
    }

    return optimized;
  }

  /**
   * Optimize a single content record
   */
  optimizeContentItem(item) {
    try {
      const seoMeta = this.safeParseJSON(item.seo_metadata, {});
      const qualityMetrics = this.safeParseJSON(item.quality_metrics, {});
      const articleContent = item.article_content || '';

      const title = seoMeta.title || this.generateTitleFromContent(articleContent);
      const metaDescription = this.truncate(
        seoMeta.meta_description || this.generateDescription(articleContent),
        155
      );
      const focusKeyphrase = seoMeta.focus_keyphrase || seoMeta.title || '';
      const secondaryKeywords = Array.isArray(seoMeta.secondary_keywords)
        ? seoMeta.secondary_keywords
        : this.ensureArray(seoMeta.secondary_keywords || []);

      const slug = this.slugify(title || focusKeyphrase);
      const schema = this.buildArticleSchema({
        title,
        description: metaDescription,
        slug,
        focusKeyphrase,
        topicId: item.topic_id
      });

      const openGraph = {
        og_title: title,
        og_description: metaDescription,
        og_type: 'article'
      };

      const twitter = {
        card: 'summary_large_image',
        title,
        description: metaDescription
      };

      const enrichedSeoMeta = {
        ...seoMeta,
        title,
        meta_description: metaDescription,
        focus_keyphrase: focusKeyphrase,
        secondary_keywords: secondaryKeywords,
        slug,
        schema_markup: schema,
        open_graph: openGraph,
        twitter_card: twitter,
        last_optimized_at: new Date().toISOString()
      };

      const enrichedQuality = {
        ...qualityMetrics,
        seo_score: this.calculateSeoScore({
          title,
          description: metaDescription,
          focusKeyphrase,
          secondaryKeywords,
          articleContent
        }),
        optimized_by: 'seo-optimizer',
        optimized_at: new Date().toISOString()
      };

      return {
        content_id: item.content_id,
        topic_id: item.topic_id,
        seo_metadata: enrichedSeoMeta,
        quality_metrics: enrichedQuality
      };

    } catch (error) {
      console.error(`⚠️  Failed to optimize content ${item.content_id}:`, error.message);
      return null;
    }
  }

  /**
   * Helpers
   */

  safeParseJSON(value, fallback) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [];
  }

  truncate(text, maxLength) {
    if (!text) return '';
    // Use proper ellipsis character and only truncate if significantly over limit
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  }

  slugify(text) {
    return (text || '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 96);
  }

  generateTitleFromContent(content) {
    if (!content) return 'Financial Insights';
    const firstHeading = content.match(/#+\s+(.*)/);
    if (firstHeading) {
      return firstHeading[1].trim();
    }
    // Don't truncate - let the full title through for better SEO
    return content.split('\n').find(line => line.trim().length > 20)?.trim() || 'Financial Insights';
  }

  generateDescription(content) {
    if (!content) return 'Expert financial analysis and investment insights.';
    const sanitized = content.replace(/[#>*\-\[\]\(\)`]/g, ' ').replace(/\s+/g, ' ');
    return sanitized.slice(0, 155).trim();
  }

  buildArticleSchema({ title, description, slug, focusKeyphrase, topicId }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      keywords: focusKeyphrase ? [focusKeyphrase] : [],
      url: slug ? `https://plindia.com/${slug}` : undefined,
      about: focusKeyphrase || undefined,
      identifier: topicId,
      author: {
        '@type': 'Organization',
        name: 'PL Capital'
      },
      publisher: {
        '@type': 'Organization',
        name: 'PL Capital',
        logo: {
          '@type': 'ImageObject',
          url: 'https://plindia.com/logo.png'
        }
      },
      dateModified: new Date().toISOString()
    };
  }

  calculateSeoScore({ title, description, focusKeyphrase, secondaryKeywords, articleContent }) {
    let score = 50;
    if (title && title.length <= 60) score += 10;
    if (description && description.length >= 120 && description.length <= 160) score += 10;
    if (focusKeyphrase && title && title.toLowerCase().includes(focusKeyphrase.toLowerCase())) score += 10;
    if (secondaryKeywords && secondaryKeywords.length >= 2) score += 5;
    if (articleContent && articleContent.length > 1500) score += 10;
    return Math.min(score, 100);
  }
}

module.exports = SEOOptimizer;

// CLI usage
if (require.main === module) {
  const optimizer = new SEOOptimizer({
    autoApprove: process.argv.includes('--auto-approve')
  });

  optimizer.optimize()
    .then(() => console.log('🎉 SEO optimization completed!'))
    .catch(error => {
      console.error('❌ SEO optimization failed:', error.message);
      process.exit(1);
    });
}
