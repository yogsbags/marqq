#!/usr/bin/env node

/**
 * Content Exporter Utility
 * Exports generated content in various formats: Markdown, HTML, CSV
 */

const fs = require('fs');
const path = require('path');

class ContentExporter {
  constructor() {
    this.exportsDir = path.resolve(__dirname, '../data/exports');
    this.ensureExportsDirectory();
  }

  /**
   * Ensure exports directory exists
   */
  ensureExportsDirectory() {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
      console.log(`📁 Created exports directory: ${this.exportsDir}`);
    }
  }

  /**
   * Generate a slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Extract FAQs from article content
   */
  extractFAQs(articleContent) {
    const faqs = [];
    const faqRegex = /###\s+(.+?)\n\n?([\s\S]+?)(?=\n###|\n##|\n---|\n\n---|$)/gs;

    // Check if there's a FAQ section
    const faqSectionMatch = articleContent.match(/##\s+FAQs?.*?\n([\s\S]*?)(?=\n---|##\s+SEO Metadata|$)/i);

    if (faqSectionMatch) {
      const faqSection = faqSectionMatch[1];
      let match;

      while ((match = faqRegex.exec(faqSection)) !== null) {
        const question = match[1].trim();
        const answer = match[2].trim().replace(/\n\n/g, ' ').replace(/\n/g, ' ');

        if (question && answer) {
          faqs.push({
            question: question,
            answer: answer
          });
        }
      }
    }

    return faqs;
  }

  /**
   * Generate FAQ Schema JSON-LD
   */
  generateFAQSchema(faqs, url) {
    if (!faqs || faqs.length === 0) {
      return '';
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    return `\n### FAQ Schema (JSON-LD)\n\`\`\`html\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n\`\`\`\n\n`;
  }

  /**
   * Format content as markdown file with SEO metadata
   * Matches the format used in batch-technical-analysis-generator.js
   */
  formatMarkdown(content, primaryKeyword = null) {
    const { article_content, compliance } = content;
    const research_log = content.research_log || content.__research_verification || '';

    // Parse seo_metadata from JSON string
    let seo_metadata;
    try {
      seo_metadata = content.__seo || (typeof content.seo_metadata === 'string'
        ? JSON.parse(content.seo_metadata)
        : content.seo_metadata);
    } catch (error) {
      console.warn('⚠️  Failed to parse seo_metadata, using defaults');
      seo_metadata = {};
    }

    let markdown = '';

    // Add H1 title (only at top of file)
    if (seo_metadata?.title) {
      markdown += `# ${seo_metadata.title}\n\n`;
    }

    // Add RESEARCH VERIFICATION section (BEFORE Summary)
    if (research_log && research_log !== 'N/A - Fallback mode (JSON parsing failed)') {
      markdown += `### RESEARCH VERIFICATION\n\n${research_log}\n\n---\n\n`;
    }

    // Add article content (starts with ## Summary)
    markdown += article_content || '';

    // Add compliance/disclaimer at the end
    if (compliance) {
      markdown += `\n\n---\n\n${compliance}`;
    }

    // Add SEO metadata section
    markdown += '\n\n---\n\n## SEO Metadata\n\n';

    if (seo_metadata?.title) {
      markdown += `### SEO Meta Title\n\`\`\`\n${seo_metadata.title}\n\`\`\`\n\n`;
    }

    if (seo_metadata?.meta_description) {
      markdown += `### SEO Meta Description\n\`\`\`\n${seo_metadata.meta_description}\n\`\`\`\n\n`;
    }

    if (seo_metadata?.focus_keyphrase) {
      markdown += `### Focus Keyword\n\`\`\`\n${seo_metadata.focus_keyphrase}\n\`\`\`\n\n`;
    }

    if (seo_metadata?.secondary_keywords && seo_metadata.secondary_keywords.length > 0) {
      markdown += `### Secondary Keywords\n\`\`\`\n${seo_metadata.secondary_keywords.join(', ')}\n\`\`\`\n\n`;
    }

    // Add canonical URL
    const keyword = primaryKeyword || content.primary_keyword || content.topic_id || 'article';
    const slug = this.generateSlug(keyword);
    const canonicalUrl = `https://www.plindia.com/blog/${slug}`;
    markdown += `### SEO Optimized URL\n\`\`\`\n${canonicalUrl}\n\`\`\`\n\n`;

    // Extract and add FAQ schema if FAQs exist
    const faqs = this.extractFAQs(article_content);
    if (faqs.length > 0) {
      markdown += this.generateFAQSchema(faqs, canonicalUrl);
    }

    return markdown;
  }

  /**
   * Export content as Markdown file
   * @param {Object} content - Content object with article_content and metadata
   * @param {string} filename - Optional custom filename
   * @returns {string} Path to exported file
   */
  exportMarkdown(content, filename = null) {
    try {
      const seoMeta = typeof content.seo_metadata === 'string'
        ? JSON.parse(content.seo_metadata)
        : content.seo_metadata || {};

      // Generate filename from title or content_id
      const sanitizedTitle = (seoMeta.title || content.topic_id || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const defaultFilename = `${sanitizedTitle}.md`;
      const finalFilename = filename || defaultFilename;
      const filepath = path.join(this.exportsDir, finalFilename);

      // Format markdown with proper structure
      const markdown = this.formatMarkdown(content, content.primary_keyword);

      // Write markdown file
      fs.writeFileSync(filepath, markdown, 'utf-8');

      console.log(`✅ Markdown exported: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ Markdown export failed:', error.message);
      throw error;
    }
  }

  /**
   * Convert Markdown to clean HTML (without Research Verification)
   * Matches the format from docs/html_articles/technical analysis/ai-stocks-in-india.html
   * @param {string} markdown - Markdown content
   * @param {Object} content - Full content object with metadata
   * @returns {string} Clean HTML content
   */
  markdownToHtml(markdown, content) {
    if (!markdown) return '';

    // Parse SEO metadata
    const seoMeta = typeof content.seo_metadata === 'string'
      ? JSON.parse(content.seo_metadata)
      : content.seo_metadata || {};

    const compliance = content.compliance || '';
    const research_log = content.research_log || content.__research_verification || '';

    // Remove RESEARCH VERIFICATION section from markdown (it should NOT appear in HTML)
    let cleanMarkdown = markdown;
    if (cleanMarkdown.includes('### RESEARCH VERIFICATION')) {
      cleanMarkdown = cleanMarkdown.replace(/###\s+RESEARCH VERIFICATION\s*\n\n[\s\S]*?\n---\n\n/, '');
    }

    // Remove SEO Metadata section (we'll add it as HTML comments later)
    if (cleanMarkdown.includes('## SEO Metadata')) {
      cleanMarkdown = cleanMarkdown.replace(/---\n\n##\s+SEO Metadata[\s\S]*$/, '');
    }

    // Remove FAQ Schema section (we'll add it as JSON-LD later)
    if (cleanMarkdown.includes('### FAQ Schema')) {
      cleanMarkdown = cleanMarkdown.replace(/###\s+FAQ Schema.*?```\n\n/gs, '');
    }

    // Remove compliance/disclaimer (we'll add it separately)
    if (cleanMarkdown.includes('---') && compliance) {
      cleanMarkdown = cleanMarkdown.replace(/\n---\n\n.*$/s, '');
    }

    let html = cleanMarkdown;

    // Convert markdown tables to HTML tables
    html = this.convertMarkdownTables(html);

    // Convert headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Add H1 title at the very top from SEO metadata (if not already present)
    if (seoMeta?.title && !html.includes('<h1>')) {
      html = `<h1>${seoMeta.title}</h1>\n` + html;
    }

    // Convert bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Convert ordered lists (must come before unordered)
    html = this.convertOrderedLists(html);

    // Convert unordered lists
    html = this.convertUnorderedLists(html);

    // Convert horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Convert paragraphs (lines not already wrapped)
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('<')) return line; // Already HTML
      if (line.match(/^#{1,6} /)) return line; // Heading marker (should be removed by now)
      return '<p>' + line + '</p>';
    });

    html = processedLines.filter(l => l).join('\n');

    // Add important notes section (like in reference)
    if (compliance) {
      html += `\n<div class="important-notes"><p><strong>Important Notes:</strong></p>\n<ul>\n<li><em>${compliance}</em></li>\n</ul>\n<hr>\n\n\n`;
    }

    // Add SEO metadata as HTML comments
    const keyword = content.primary_keyword || content.topic_id || 'article';
    const slug = this.generateSlug(keyword);
    const canonicalUrl = `https://www.plindia.com/blog/${slug}`;

    html += `\n<!-- SEO Metadata -->\n`;
    html += `<!-- SEO Optimized URL: ${canonicalUrl} -->\n`;
    html += `<!-- SEO Meta Title: ${seoMeta.title || ''} -->\n`;
    html += `<!-- SEO Meta Description: ${(seoMeta.meta_description || '').substring(0, 100)}... -->\n`;

    // Extract FAQs and add FAQ Schema as JSON-LD
    const faqs = this.extractFAQs(markdown);
    if (faqs.length > 0) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };

      html += `\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n`;
    }

    return html;
  }

  /**
   * Convert markdown tables to HTML tables
   */
  convertMarkdownTables(markdown) {
    const tableRegex = /\|(.+?)\|\n\|(?:-+\|)+\n((?:\|.+?\|\n?)+)/g;

    return markdown.replace(tableRegex, (match, header, body) => {
      const headers = header.split('|').map(h => h.trim()).filter(h => h);
      const rows = body.trim().split('\n').map(row =>
        row.split('|').map(cell => cell.trim()).filter(cell => cell)
      );

      let html = '<table>\n<thead>\n<tr>\n';
      headers.forEach(h => {
        html += `<th align="left">${h}</th>\n`;
      });
      html += '</tr>\n</thead>\n<tbody>';

      rows.forEach(row => {
        html += '<tr>\n';
        row.forEach(cell => {
          html += `<td align="left">${cell}</td>\n`;
        });
        html += '</tr>\n';
      });

      html += '</tbody></table>\n';
      return html;
    });
  }

  /**
   * Convert markdown ordered lists to HTML
   */
  convertOrderedLists(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);

      if (orderedMatch) {
        if (!inList) {
          html += '<ol>\n';
          inList = true;
        }
        html += `<li>${orderedMatch[2]}</li>\n`;
      } else {
        if (inList) {
          html += '</ol>\n';
          inList = false;
        }
        html += lines[i] + '\n';
      }
    }

    if (inList) {
      html += '</ol>\n';
    }

    return html;
  }

  /**
   * Convert markdown unordered lists to HTML
   */
  convertUnorderedLists(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const unorderedMatch = line.match(/^[*-]\s+(.+)$/);

      if (unorderedMatch) {
        if (!inList) {
          html += '<ul>\n';
          inList = true;
        }
        html += `<li>${unorderedMatch[1]}</li>\n`;
      } else {
        if (inList) {
          html += '</ul>\n';
          inList = false;
        }
        html += lines[i] + '\n';
      }
    }

    if (inList) {
      html += '</ul>\n';
    }

    return html;
  }

  /**
   * Export content as HTML file (without Research Verification)
   * Matches format from docs/html_articles/technical analysis/ai-stocks-in-india.html
   * @param {Object} content - Content object with article_content and metadata
   * @param {string} filename - Optional custom filename
   * @returns {string} Path to exported file
   */
  exportHtml(content, filename = null) {
    try {
      const articleContent = content.article_content || '';
      const seoMeta = typeof content.seo_metadata === 'string'
        ? JSON.parse(content.seo_metadata)
        : content.seo_metadata || {};

      // Convert markdown to clean HTML (without Research Verification)
      const html = this.markdownToHtml(articleContent, content);

      // Generate filename (no content_id suffix)
      const sanitizedTitle = (seoMeta.title || content.topic_id || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const defaultFilename = `${sanitizedTitle}.html`;
      const finalFilename = filename || defaultFilename;
      const filepath = path.join(this.exportsDir, finalFilename);

      // Write HTML file
      fs.writeFileSync(filepath, html, 'utf-8');

      console.log(`✅ HTML exported: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ HTML export failed:', error.message);
      throw error;
    }
  }

  /**
   * Export content as CSV row
   * @param {Array} contents - Array of content objects
   * @param {string} filename - Optional custom filename
   * @returns {string} Path to exported file
   */
  exportCsv(contents, filename = null) {
    try {
      const { stringify } = require('csv-stringify/sync');

      // Prepare data for CSV export
      const rows = contents.map(content => {
        const seoMeta = typeof content.seo_metadata === 'string'
          ? JSON.parse(content.seo_metadata)
          : content.seo_metadata || {};

        return {
          content_id: content.content_id || '',
          topic_id: content.topic_id || '',
          title: seoMeta.title || '',
          creation_date: content.creation_date || '',
          meta_description: seoMeta.meta_description || '',
          focus_keyphrase: seoMeta.focus_keyphrase || '',
          word_count: content.article_content ? content.article_content.split(/\s+/).length : 0,
          approval_status: content.approval_status || '',
          created_at: content.created_at || ''
        };
      });

      const csvContent = stringify(rows, {
        header: true,
        quoted: true
      });

      // Generate filename
      const defaultFilename = `content-export-${Date.now()}.csv`;
      const finalFilename = filename || defaultFilename;
      const filepath = path.join(this.exportsDir, finalFilename);

      // Write CSV file
      fs.writeFileSync(filepath, csvContent, 'utf-8');

      console.log(`✅ CSV exported: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ CSV export failed:', error.message);
      throw error;
    }
  }

  /**
   * Export all formats at once
   * @param {Object} content - Content object
   * @param {string} baseFilename - Base filename (without extension)
   * @returns {Object} Paths to all exported files
   */
  exportAll(content, baseFilename = null) {
    const seoMeta = typeof content.seo_metadata === 'string'
      ? JSON.parse(content.seo_metadata)
      : content.seo_metadata || {};

    const sanitizedTitle = (seoMeta.title || content.topic_id || 'article')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Use sanitized title without content_id suffix (matches markdown/html pattern)
    const base = baseFilename || sanitizedTitle;

    const markdownPath = this.exportMarkdown(content, `${base}.md`);
    const htmlPath = this.exportHtml(content, `${base}.html`);
    const csvPath = this.exportCsv([content], `${base}.csv`);

    console.log('\n✅ All formats exported successfully!');
    console.log(`📝 Markdown: ${markdownPath}`);
    console.log(`🌐 HTML: ${htmlPath}`);
    console.log(`📊 CSV: ${csvPath}`);

    return {
      markdown: markdownPath,
      html: htmlPath,
      csv: csvPath
    };
  }
}

module.exports = ContentExporter;

// CLI usage
if (require.main === module) {
  const exporter = new ContentExporter();

  // Example: Export a test content
  const testContent = {
    content_id: 'CONTENT-001',
    topic_id: 'TOPIC-001',
    creation_date: '2025-12-07',
    seo_metadata: JSON.stringify({
      title: 'Test Article',
      meta_description: 'This is a test article',
      focus_keyphrase: 'test article'
    }),
    article_content: `# Test Article

## Introduction

This is a **test article** with some *markdown* formatting.

## Key Points

* Point one
* Point two
* Point three

## Conclusion

Visit [our website](https://example.com) for more information.

---

## Research Verification

This article was generated for testing purposes.`,
    approval_status: 'Needs-SEO',
    created_at: new Date().toISOString()
  };

  console.log('\n📤 Testing Content Exporter...\n');
  exporter.exportAll(testContent);
}
