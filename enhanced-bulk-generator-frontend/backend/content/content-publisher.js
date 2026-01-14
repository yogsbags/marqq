#!/usr/bin/env node

/**
 * Content Publisher for Enhanced Bulk Generator
 * Publishes SEO-ready content to WordPress and Sanity
 */

// Resolve module paths for Vercel deployment
require('../module-resolver');

const fetch = require('node-fetch');
const CSVDataManager = require('../core/csv-data-manager');

class ContentPublisher {
  constructor(config = {}) {
    this.csvManager = new CSVDataManager();

    this.config = {
      publishStatus: config.publishStatus || process.env.PUBLISH_STATUS || 'draft',
      wpBaseUrl: config.wpBaseUrl || process.env.WP_BASE_URL,
      wpUser: config.wpUser || process.env.WP_USERNAME,
      wpPassword:
        config.wpPassword ||
        process.env.WP_APPLICATION_PASSWORD ||
        process.env.WP_PASSWORD,
      // UAT WordPress configuration
      uatWpBaseUrl: config.uatWpBaseUrl || process.env.UAT_WP_BASE_URL,
      uatWpUser: config.uatWpUser || process.env.UAT_WP_USERNAME,
      uatWpPassword:
        config.uatWpPassword ||
        process.env.UAT_WP_APPLICATION_PASSWORD ||
        process.env.UAT_WP_PASSWORD,
      uatPublishStatus: config.uatPublishStatus || process.env.UAT_PUBLISH_STATUS || 'draft',
      sanityProjectId: config.sanityProjectId || process.env.SANITY_PROJECT_ID,
      sanityDataset: config.sanityDataset || process.env.SANITY_DATASET || 'production',
      sanityToken: config.sanityToken || process.env.SANITY_TOKEN,
      frontendBaseUrl:
        config.frontendBaseUrl ||
        process.env.NEXT_FRONTEND_BASE_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_BASE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        'http://localhost:3000',
      publicationLimit: config.publicationLimit || config.contentLimit || config.topicLimit || null
    };
  }

  /**
   * Publish all SEO-ready content
   */
  async publishAll() {
    console.log('\n🚀 PUBLICATION STARTED');
    console.log('='.repeat(60));

    let readyContent = this.csvManager.getContentByApprovalStatus(['SEO-Ready']);

    if (readyContent.length === 0) {
      console.log('⚠️  No content marked as SEO-Ready. Approve content in Stage 5 first.');
      return [];
    }

    readyContent = readyContent
      .sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });

    if (this.config.publicationLimit && readyContent.length > this.config.publicationLimit) {
      console.log(`🔍 Limiting publication to first ${this.config.publicationLimit} item(s)`);
      readyContent = readyContent.slice(0, this.config.publicationLimit);
    }

    const publishedRecords = [];

    for (const content of readyContent) {
      const normalized = this.normalizeContent(content);
      console.log(`\n🚀 Publishing content ${normalized.content_id} (${normalized.title})`);

      const wordpressResult = await this.publishToWordPress(normalized);
      const uatWordpressResult = await this.publishToUATWordPress(normalized);
      const sanityResult = await this.publishToSanity(normalized);

      const hasSuccess = wordpressResult.success || uatWordpressResult.success || sanityResult.success;
      const successfulResults = [wordpressResult, uatWordpressResult, sanityResult].filter(result => result.success);
      const simulatedSuccess =
        hasSuccess &&
        successfulResults.length > 0 &&
        successfulResults.every(result => result.status === 'simulated' || result.status.startsWith('simulated-'));
      const publishStatus = hasSuccess
        ? (simulatedSuccess ? 'Simulated' : 'Published')
        : 'Publishing-Failed';

      const qualityMetrics = this.mergeQualityMetrics(normalized.originalQualityMetrics, {
        published_at: new Date().toISOString(),
        wordpress_status: wordpressResult.status,
        uat_wordpress_status: uatWordpressResult.status,
        sanity_status: sanityResult.status,
        publication_status: publishStatus
      });

      this.csvManager.updateCreatedContent(normalized.content_id, {
        approval_status: publishStatus,
        quality_metrics: qualityMetrics
      });

      const record = {
        content_id: normalized.content_id,
        topic_id: normalized.topic_id,
        wordpress_url: wordpressResult.url,
        uat_wordpress_url: uatWordpressResult.url,
        sanity_url: sanityResult.url,
        sanity_desk_url: sanityResult.deskUrl || '',
        publish_date: new Date().toISOString(),
        status: publishStatus,
        performance_metrics: JSON.stringify({
          wordpress: wordpressResult.status,
          wordpress_id: wordpressResult.id || '',
          wordpress_edit_url: wordpressResult.editUrl || '',
          uat_wordpress: uatWordpressResult.status,
          uat_wordpress_id: uatWordpressResult.id || '',
          uat_wordpress_edit_url: uatWordpressResult.editUrl || '',
          sanity: sanityResult.status,
          sanity_document_id: sanityResult.documentId || '',
          sanity_desk_url: sanityResult.deskUrl || '',
          simulated: simulatedSuccess
        })
      };

      this.csvManager.savePublishedContent(record);
      publishedRecords.push({ ...record, wordpressResult, uatWordpressResult, sanityResult });

      console.log(`✅ Publication status: ${publishStatus}`);
      if (wordpressResult.url) {
        console.log(`   🔗 Local WordPress: ${wordpressResult.url}`);
      }
      if (uatWordpressResult.url) {
        console.log(`   🔗 UAT WordPress: ${uatWordpressResult.url}`);
      }
      if (sanityResult.url) {
        console.log(`   🔗 Frontend: ${sanityResult.url}`);
      }
      if (sanityResult.deskUrl) {
        console.log(`   🗂️  Sanity Desk: ${sanityResult.deskUrl}`);
      }
      if (publishStatus === 'Simulated') {
        console.log('   🛈 Simulation mode: provide WP_*, UAT_WP_*, and SANITY_* credentials for live publishing.');
      }
    }

    return publishedRecords;
  }

  /**
   * Prepare content for publication
   */
  normalizeContent(content) {
    const seoMeta = this.safeParseJSON(content.seo_metadata, {});
    const title = seoMeta.title || 'PL Capital Article';
    const slug = seoMeta.slug || this.slugify(title);
    const focusKeyphrase = seoMeta.focus_keyphrase || '';
    const description = seoMeta.meta_description || '';
    const markdown = content.article_content || '';
    const hero = this.safeParseJSON(content.hero_image, {});
    const heroHtml = this.heroImageToHtml(hero);
    const htmlContent = this.buildArticleHtml(markdown, heroHtml);
    const excerptSource = description || this.extractExcerptFromHtml(htmlContent);

    return {
      content_id: content.content_id,
      topic_id: content.topic_id,
      title,
      slug,
      focusKeyphrase,
      description,
      excerpt: excerptSource,
      articleContent: markdown,
      articleHtml: htmlContent,
      heroImage: hero,
      category: seoMeta.category || 'Insights',
      frontendUrl: this.buildFrontendUrl(slug),
      seoMeta,
      originalQualityMetrics: this.safeParseJSON(content.quality_metrics, {})
    };
  }

  /**
   * Publish to WordPress if credentials available; otherwise simulate
   */
  async publishToWordPress(content) {
    if (!this.config.wpBaseUrl || !this.config.wpUser || !this.config.wpPassword) {
      console.log('ℹ️  WordPress credentials missing. Recording simulated draft URL instead.');
      return this.simulatedResult(content.slug, 'simulated', {
        url: content.frontendUrl
      });
    }

    const base = this.config.wpBaseUrl.replace(/\/$/, '');
    const endpoint = `${base}/?rest_route=/wp/v2/posts`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`${this.config.wpUser}:${this.config.wpPassword}`).toString('base64')
        },
        body: JSON.stringify({
          title: content.title,
          content: content.articleHtml,
          excerpt: content.excerpt,
          status: this.config.publishStatus,
          slug: content.slug,
          meta: {
            meta_description: content.description,
            focus_keyword: content.focusKeyphrase
          },
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`⚠️  WordPress publish failed (${response.status}): ${JSON.stringify(data)}`);
        console.warn('   → Falling back to simulated draft URL for workflow continuity.');
        // Use WordPress base URL for fallback, not frontend URL
        const wpBase = this.config.wpBaseUrl.replace(/\/$/, '');
        return this.simulatedResult(content.slug, `wordpress-${response.status}`, {
          url: `${wpBase}/${content.slug}`
        });
      }

      // Build URL using configured base + slug (ignore WordPress's data.link as it may be misconfigured)
      const wpBase = this.config.wpBaseUrl.replace(/\/$/, '');
      return {
        success: true,
        status: 'wordpress',
        url: `${wpBase}/${content.slug}`,
        id: data.id,
        editUrl: data.id
          ? `${wpBase}/wp-admin/post.php?post=${data.id}&action=edit`
          : ''
      };
    } catch (error) {
      console.error('⚠️  WordPress publish error:', error.message);
      // Use WordPress base URL for fallback, not frontend URL
      const wpBase = this.config.wpBaseUrl.replace(/\/$/, '');
      return this.simulatedResult(content.slug, 'wordpress-error', {
        url: `${wpBase}/${content.slug}`
      });
    }
  }

  /**
   * Publish to UAT WordPress (custom post type: blogs) if credentials available
   */
  async publishToUATWordPress(content) {
    if (!this.config.uatWpBaseUrl || !this.config.uatWpUser || !this.config.uatWpPassword) {
      console.log('ℹ️  UAT WordPress credentials missing. Skipping UAT publication.');
      return this.simulatedResult(content.slug, 'simulated-uat-missing', {
        url: ''
      });
    }

    const base = this.config.uatWpBaseUrl.replace(/\/$/, '');
    const endpoint = `${base}/wp-json/wp/v2/blogs`;

    try {
      // Upload hero image if available
      let heroImageAttachmentId = null;
      // Priority: imgbb hosted_url > DALL-E url > local_path
      const heroImageUrl = content.heroImage?.hosted_url || content.heroImage?.url || content.heroImage?.local_path;
      if (heroImageUrl) {
        try {
          heroImageAttachmentId = await this.uploadImageToWordPress(
            heroImageUrl,
            this.config.uatWpBaseUrl,
            this.config.uatWpUser,
            this.config.uatWpPassword,
            {
              alt: content.heroImage?.alt || content.title,
              title: content.title,
              caption: content.heroImage?.prompt || ''
            }
          );
        } catch (uploadError) {
          console.warn(`⚠️  Hero image upload failed, continuing without image: ${uploadError.message}`);
          // Continue without image rather than failing entire publication
        }
      }

      // Prepare ACF fields
      const acfFields = {
        inpost_banner_link: 'https://www.plindia.com/open-demat-account/',
        inpost_banner_alt: 'Open your Demat account with PL India today',
        banner_cta: 'Start Your Investment Journey Today',
        cta_anchor: 'Open Free Demat Account',
        cta_target_url: 'https://www.plindia.com/open-demat-account/'
      };

      // Add hero image if uploaded successfully
      if (heroImageAttachmentId) {
        acfFields.detailed_blog_banner_image = heroImageAttachmentId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`${this.config.uatWpUser}:${this.config.uatWpPassword}`).toString('base64')
        },
        body: JSON.stringify({
          title: content.title,
          content: content.articleHtml,
          excerpt: content.excerpt,
          status: this.config.uatPublishStatus,
          slug: content.slug,
          // Note: blogs_category taxonomy is not REST-enabled, so we skip it
          acf: acfFields,
          meta: {
            _yoast_wpseo_title: content.title,
            _yoast_wpseo_metadesc: content.description,
            _yoast_wpseo_focuskw: content.focusKeyphrase
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`⚠️  UAT WordPress publish failed (${response.status}): ${JSON.stringify(data)}`);
        console.warn('   → Continuing with other platforms.');
        // Use UAT WordPress base URL for fallback
        const uatBase = this.config.uatWpBaseUrl.replace(/\/$/, '');
        return this.simulatedResult(content.slug, `uat-wordpress-${response.status}`, {
          url: `${uatBase}/${content.slug}`
        });
      }

      // Build URL using configured base + slug (ignore WordPress's data.link as it may be misconfigured)
      const uatBase = this.config.uatWpBaseUrl.replace(/\/$/, '');
      return {
        success: true,
        status: 'uat-wordpress',
        url: `${uatBase}/${content.slug}`,
        id: data.id,
        editUrl: data.id
          ? `${uatBase}/wp-admin/post.php?post=${data.id}&action=edit`
          : ''
      };
    } catch (error) {
      console.error('⚠️  UAT WordPress publish error:', error.message);
      // Use UAT WordPress base URL for fallback
      const uatBase = this.config.uatWpBaseUrl.replace(/\/$/, '');
      return this.simulatedResult(content.slug, 'uat-wordpress-error', {
        url: `${uatBase}/${content.slug}`
      });
    }
  }

  /**
   * Upload image to WordPress and get attachment ID
   * Supports both URLs and local file paths
   */
  async uploadImageToWordPress(imageSource, wpBaseUrl, wpUser, wpPassword, metadata = {}) {
    console.log('🔍 uploadImageToWordPress called');
    console.log('   Image source:', imageSource);
    console.log('   WP URL:', wpBaseUrl);
    console.log('   WP User:', wpUser);
    console.log('   Has password:', !!wpPassword);

    if (!imageSource || !wpBaseUrl || !wpUser || !wpPassword) {
      console.log('❌ Missing required parameters for image upload');
      return null;
    }

    const fs = require('fs');
    const path = require('path');
    const FormData = require('form-data');

    try {
      let imageBuffer;
      let filename;
      let contentType;

      // Check if it's a URL or local file path
      if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
        console.log('📥 Fetching image from URL...');
        // Fetch from URL
        const imageResponse = await fetch(imageSource);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        imageBuffer = await imageResponse.buffer();
        contentType = imageResponse.headers.get('content-type') || 'image/png';

        // Extract filename from URL or generate one
        const urlPath = new URL(imageSource).pathname;
        filename = path.basename(urlPath) || `image-${Date.now()}.png`;
        console.log('   ✓ Image fetched:', filename, `(${imageBuffer.length} bytes)`);
      } else {
        console.log('📂 Reading image from local filesystem...');
        // Read from local filesystem
        if (!fs.existsSync(imageSource)) {
          throw new Error(`Local image file not found: ${imageSource}`);
        }

        imageBuffer = fs.readFileSync(imageSource);
        filename = path.basename(imageSource);
        const ext = path.extname(imageSource).toLowerCase();
        contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                     ext === '.webp' ? 'image/webp' : 'image/png';
        console.log('   ✓ Image loaded:', filename, `(${imageBuffer.length} bytes, ${contentType})`);
      }

      // Create form data
      console.log('📦 Creating FormData...');
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename,
        contentType
      });

      // Add metadata if provided
      if (metadata.alt) {
        form.append('alt_text', metadata.alt);
        console.log('   ✓ Alt text added');
      }
      if (metadata.title) {
        form.append('title', metadata.title);
        console.log('   ✓ Title added');
      }
      if (metadata.caption) {
        form.append('caption', metadata.caption);
        console.log('   ✓ Caption added');
      }

      // Upload to WordPress media library
      const base = wpBaseUrl.replace(/\/$/, '');
      const endpoint = `${base}/wp-json/wp/v2/media`;
      const auth = 'Basic ' + Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');

      console.log('🚀 Uploading to WordPress media library...');
      console.log('   Endpoint:', endpoint);

      // Create abort controller for timeout
      const AbortController = require('abort-controller');
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 300000); // 5 minute timeout (increased from 60s for Railway → UAT WordPress latency + slow server responses)

      const uploadResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': auth
        },
        body: form,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeout);
      });

      console.log('📨 Response received:', uploadResponse.status, uploadResponse.statusText);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('❌ WordPress media upload failed:');
        console.error('   Status:', uploadResponse.status);
        console.error('   Error data:', JSON.stringify(errorData, null, 2));
        throw new Error(`WordPress media upload failed (${uploadResponse.status}): ${JSON.stringify(errorData)}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('✅ Image uploaded successfully!');
      console.log('   Attachment ID:', uploadData.id);
      console.log('   Media URL:', uploadData.source_url);
      return uploadData.id; // Return attachment ID
    } catch (error) {
      console.error('❌ Image upload error:', error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  /**
   * Get or create category ID for UAT WordPress blogs_category taxonomy
   */
  async getUATCategoryId(categoryName) {
    if (!this.config.uatWpBaseUrl || !this.config.uatWpUser || !this.config.uatWpPassword) {
      return null;
    }

    const base = this.config.uatWpBaseUrl.replace(/\/$/, '');
    const endpoint = `${base}/wp-json/wp/v2/blogs_category`;
    const auth = 'Basic ' + Buffer.from(`${this.config.uatWpUser}:${this.config.uatWpPassword}`).toString('base64');

    try {
      // Search for existing category
      const searchResponse = await fetch(`${endpoint}?search=${encodeURIComponent(categoryName)}`, {
        headers: { Authorization: auth }
      });

      if (searchResponse.ok) {
        const categories = await searchResponse.json();
        if (categories && categories.length > 0) {
          return categories[0].id;
        }
      }

      // Create new category if not found
      const createResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth
        },
        body: JSON.stringify({
          name: categoryName,
          slug: this.slugify(categoryName)
        })
      });

      if (createResponse.ok) {
        const newCategory = await createResponse.json();
        return newCategory.id;
      }

      console.warn(`⚠️  Could not create category "${categoryName}". Using no category.`);
      return null;
    } catch (error) {
      console.warn(`⚠️  Category fetch/create error: ${error.message}`);
      return null;
    }
  }

  /**
   * Publish structured content to Sanity dataset if credentials available
   */
  async publishToSanity(content) {
    if (!this.config.sanityProjectId || !this.config.sanityToken) {
      console.log('ℹ️  Sanity credentials missing. Recording simulated draft URL instead.');
      return this.simulatedResult(content.slug, 'simulated', {
        url: content.frontendUrl,
        deskUrl: this.buildSanityDeskUrl(`post-${content.content_id}`)
      });
    }

    const endpoint = `https://${this.config.sanityProjectId}.api.sanity.io/v1/data/mutate/${this.config.sanityDataset}`;

    // Upload hero image to Sanity assets if present
    let imageAssetRef = null;
    // Priority: imgbb hosted_url > DALL-E url > local_path
    const heroImageUrl = content.heroImage?.hosted_url || content.heroImage?.url || content.heroImage?.local_path;
    if (heroImageUrl) {
      try {
        imageAssetRef = await this.uploadImageToSanity(heroImageUrl, {
          alt: content.heroImage.alt || content.title,
          caption: content.heroImage.prompt || ''
        });
      } catch (error) {
        console.warn(`⚠️  Failed to upload hero image: ${error.message}`);
      }
    }

    const document = {
      _type: 'post',
      _id: `post-${content.content_id}`,
      title: content.title,
      slug: { _type: 'slug', current: content.slug },
      body: this.articleToPortableText(content.articleContent),
      excerpt: content.excerpt,
      publishedAt: new Date().toISOString(),
      ...(imageAssetRef && {
        mainImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAssetRef
          },
          alt: content.heroImage?.alt || content.title,
          caption: content.heroImage?.prompt || ''
        }
      })
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.sanityToken}`
        },
        body: JSON.stringify({ mutations: [{ createOrReplace: document }] })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`⚠️  Sanity publish failed (${response.status}): ${JSON.stringify(data)}`);
        console.warn('   → Falling back to simulated Sanity URL for workflow continuity.');
        return this.simulatedResult(content.slug, `sanity-${response.status}`, {
          url: content.frontendUrl,
          deskUrl: this.buildSanityDeskUrl(`post-${content.content_id}`)
        });
      }

      const mutation = (data.results && data.results[0]) || {};
      const documentId = mutation.id || `post-${content.content_id}`;

      return {
        success: true,
        status: 'sanity',
        url: content.frontendUrl,
        deskUrl: this.buildSanityDeskUrl(documentId),
        documentId
      };
    } catch (error) {
      console.error('⚠️  Sanity publish error:', error.message);
      return this.simulatedResult(content.slug, 'sanity-error', {
        url: content.frontendUrl,
        deskUrl: this.buildSanityDeskUrl(`post-${content.content_id}`)
      });
    }
  }

  /**
   * Upload image to Sanity assets (supports URLs and local file paths)
   */
  async uploadImageToSanity(imageUrl, metadata = {}) {
    if (!this.config.sanityProjectId || !this.config.sanityToken) {
      throw new Error('Sanity credentials missing');
    }

    let imageBuffer;
    let contentType = 'image/png';

    // Check if it's a local file path or URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Fetch from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      imageBuffer = await imageResponse.buffer();
      contentType = imageResponse.headers.get('content-type') || 'image/png';
    } else {
      // Read from local filesystem
      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(imageUrl)) {
        throw new Error(`Local image file not found: ${imageUrl}`);
      }

      imageBuffer = fs.readFileSync(imageUrl);
      const ext = path.extname(imageUrl).toLowerCase();
      contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    }

    // Upload to Sanity assets
    const uploadEndpoint = `https://${this.config.sanityProjectId}.api.sanity.io/v1/assets/images/${this.config.sanityDataset}`;

    const uploadResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${this.config.sanityToken}`
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload image to Sanity: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    return uploadData.document._id;
  }

  /**
   * Utility helpers
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
      return value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    }
    return [];
  }

  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ');
  }

  extractExcerptFromHtml(html, limit = 240) {
    const plain = this.stripHtml(html).replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    if (plain.length <= limit) {
      return plain;
    }
    const truncated = plain.slice(0, limit);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated).trim() + '…';
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  formatInlineMarkdown(text) {
    if (!text) return '';
    let output = this.escapeHtml(text);

    output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => {
      const safeUrl = this.escapeHtml(url);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    output = output.replace(/`([^`]+)`/g, '<code>$1</code>');

    return output;
  }


  heroImageToHtml(hero) {
    if (!hero || typeof hero !== 'object') {
      return '';
    }
    // Priority: imgbb hosted_url > DALL-E url > local_path
    const url = hero.hosted_url || hero.url || hero.local_path || '';
    if (!url) {
      return '';
    }
    const alt = hero.alt || 'Hero image';
    // Don't display the generation prompt as caption - it's too technical
    // Only use caption if there's a user-friendly caption field (not the AI prompt)
    const caption = hero.caption && hero.caption !== hero.prompt ? this.escapeHtml(hero.caption) : '';
    const img = `<img src="${url}" alt="${this.escapeHtml(alt)}" loading="lazy" decoding="async" />`;
    // No caption for now - just display the image
    return `<figure class="hero-image">${img}</figure>`;
  }

  buildArticleHtml(markdown, heroHtml = '') {
    const bodyHtml = this.markdownToHtml(markdown || '');
    const footerHtml = this.buildArticleFooter();
    const tableStyles = `<style>
      .table-responsive { width: 100%; overflow-x: auto; margin: 20px 0; }
      .content-table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; }
      .content-table th { background-color: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
      .content-table td { padding: 12px; border: 1px solid #ddd; }
      .content-table tr:nth-child(even) { background-color: #f8f9fa; }
      .content-table tr:hover { background-color: #e9ecef; }
      .article-footer { border-top: 2px solid #e5e7eb; margin-top: 3rem; padding-top: 2rem; }
      .article-footer__author { margin-bottom: 1.5rem; }
      .article-footer__author h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem; }
      .article-footer__share { margin-bottom: 1.5rem; }
      .article-footer__share h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem; }
      .share-buttons { display: flex; gap: 0.75rem; align-items: center; }
      .share-button { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; transition: all 0.2s; text-decoration: none; }
      .share-button:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .share-button--facebook { background-color: #1877f2; }
      .share-button--twitter { background-color: #000000; }
      .share-button--linkedin { background-color: #0a66c2; }
      .share-button--instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
      .share-button--youtube { background-color: #ff0000; }
      .share-button svg { width: 20px; height: 20px; fill: white; }
      .article-footer__disclaimer { background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 1rem 1.25rem; margin-top: 1.5rem; }
      .article-footer__disclaimer p { font-size: 0.875rem; color: #6b7280; line-height: 1.5; margin: 0; }
      .article-footer__disclaimer strong { color: #374151; }
    </style>`;

    if (!heroHtml) {
      return `${tableStyles}\n${bodyHtml}\n${footerHtml}`;
    }
    return `${tableStyles}\n${heroHtml}\n${bodyHtml}\n${footerHtml}`;
  }

  buildArticleFooter() {
    return `
<div class="article-footer">
  <hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 0 0 2rem 0;">

  <div class="article-footer__author">
    <h3>Article by</h3>
    <p style="margin: 0; font-size: 1rem; color: #374151;">
      <strong>PL Capital</strong>
    </p>
  </div>

  <div class="article-footer__share">
    <h3>Share</h3>
    <div class="share-buttons">
      <a href="#" class="share-button share-button--facebook" title="Share on Facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(window.location.href), 'facebook-share', 'width=580,height=296'); return false;">
        <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href="#" class="share-button share-button--twitter" title="Share on X (Twitter)" onclick="window.open('https://twitter.com/intent/tweet?url='+encodeURIComponent(window.location.href)+'&text='+encodeURIComponent(document.title), 'twitter-share', 'width=550,height=420'); return false;">
        <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="#" class="share-button share-button--linkedin" title="Share on LinkedIn" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(window.location.href), 'linkedin-share', 'width=550,height=420'); return false;">
        <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="#" class="share-button share-button--instagram" title="Follow us on Instagram" onclick="window.open('https://www.instagram.com/plcapital/', 'instagram', 'width=550,height=420'); return false;">
        <svg viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
      </a>
      <a href="#" class="share-button share-button--youtube" title="Subscribe on YouTube" onclick="window.open('https://www.youtube.com/@PLCapital', 'youtube', 'width=550,height=420'); return false;">
        <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </a>
    </div>
  </div>

  <div class="article-footer__disclaimer">
    <p><strong>Disclaimer:</strong> This blog has been written exclusively for educational purposes. The securities mentioned are only examples and not recommendations. It is based on several secondary sources on the internet and is subject to changes. Please consult an expert before making related decisions.</p>
  </div>
</div>`;
  }

  markdownToHtml(markdown) {
    if (!markdown) return '';

    const lines = markdown.split(/\r?\n/);
    const htmlParts = [];
    let inList = false;
    let tableBuffer = [];

    const closeList = () => {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
    };

    const flushTable = () => {
      if (tableBuffer.length === 0) {
        return;
      }
      htmlParts.push(this.tableBufferToHtml(tableBuffer));
      tableBuffer = [];
    };

    for (const rawLine of lines) {
      const normalizedLine = rawLine.replace(/^\s*[–—]\s+/, '- ');
      const trimmed = normalizedLine.trim();

      if (!trimmed) {
        flushTable();
        closeList();
        continue;
      }

      if (/^###\s+/.test(trimmed)) {
        flushTable();
        closeList();
        htmlParts.push(`<h3>${this.formatInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h3>`);
        continue;
      }

      if (/^##\s+/.test(trimmed)) {
        flushTable();
        closeList();
        htmlParts.push(`<h2>${this.formatInlineMarkdown(trimmed.replace(/^##\s+/, ''))}</h2>`);
        continue;
      }

      if (/^-\s+/.test(trimmed)) {
        flushTable();
        if (!inList) {
          htmlParts.push('<ul>');
          inList = true;
        }
        htmlParts.push(`<li>${this.formatInlineMarkdown(trimmed.replace(/^-\s+/, ''))}</li>`);
        continue;
      }

      if (/^>\s+/.test(trimmed)) {
        flushTable();
        closeList();
        htmlParts.push(`<blockquote>${this.formatInlineMarkdown(trimmed.replace(/^>\s+/, ''))}</blockquote>`);
        continue;
      }

      if (this.isTableLine(trimmed)) {
        closeList();
        tableBuffer.push(trimmed);
        continue;
      }

      flushTable();
      closeList();
      htmlParts.push(`<p>${this.formatInlineMarkdown(trimmed)}</p>`);
    }

    flushTable();
    closeList();
    return htmlParts.join('\n');
  }

  isTableLine(line) {
    if (!line) return false;
    const trimmed = line.trim();
    if (!trimmed.includes('|')) return false;
    // Match separator rows like |---|---|---| or | --- | --- |
    if (/^\|?[\s:\-|]+\|?$/.test(trimmed) && trimmed.split('|').filter(s => s.trim()).length > 0) return true;
    // Match data rows - must have at least 2 pipe characters
    const pipeCount = (trimmed.match(/\|/g) || []).length;
    return pipeCount >= 2;
  }

  tableBufferToHtml(buffer) {
    if (!buffer || buffer.length === 0) {
      return '';
    }

    const rows = buffer
      .map(row => row.trim())
      .filter(row => row.length > 0);

    if (rows.length === 0) {
      return '';
    }

    const splitRow = (row) => {
      const trimmed = row.replace(/^\|/, '').replace(/\|$/, '');
      return trimmed.split('|').map(cell => this.formatInlineMarkdown(cell.trim()));
    };

    let headerCells = splitRow(rows[0]);
    let dataRows = rows.slice(1);

    if (dataRows.length > 0 && /^\|?[\s:\-|\t]+\|?$/.test(dataRows[0])) {
      dataRows = dataRows.slice(1);
    }

    const headerHtml = headerCells
      .map(cell => `<th>${cell}</th>`)
      .join('');

    const bodyHtml = dataRows
      .map(row => {
        const cells = splitRow(row);
        return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
      })
      .join('');

    return `<div class="table-responsive"><table class="content-table">\n<thead><tr>${headerHtml}</tr></thead>\n<tbody>${bodyHtml}</tbody>\n</table></div>`;
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

  articleToPortableText(article) {
    if (!article) {
      return [];
    }

    const blocks = [];
    const lines = article.split(/\r?\n/);
    let paragraphBuffer = [];
    let tableBuffer = [];

    const pushParagraph = () => {
      if (paragraphBuffer.length === 0) return;
      const paragraphText = paragraphBuffer.join(' ').trim();
      if (!paragraphText) {
        paragraphBuffer = [];
        return;
      }
      // Strip markdown bold syntax (**text** → text)
      const cleanText = paragraphText.replace(/\*\*([^*]+)\*\*/g, '$1');
      blocks.push({
        _type: 'block',
        style: 'normal',
        children: [
          { _type: 'span', text: cleanText, marks: [] }
        ]
      });
      paragraphBuffer = [];
    };

    const pushTable = () => {
      if (tableBuffer.length === 0) return;

      // Parse markdown table into structured format
      const rows = tableBuffer.filter(line => {
        // Filter out separator rows like |---|---|
        return !/^\|?[\s:\-|]+\|?$/.test(line);
      });

      if (rows.length === 0) {
        tableBuffer = [];
        return;
      }

      // Convert each row to cells array
      const tableRows = rows.map(row => {
        const cells = row
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(cell => {
            // Strip markdown bold syntax (**text** → text)
            return cell.trim().replace(/\*\*([^*]+)\*\*/g, '$1');
          });

        return {
          _type: 'tableRow',
          _key: `row-${Math.random().toString(36).substr(2, 9)}`,
          cells
        };
      });

      blocks.push({
        _type: 'table',
        _key: `table-${Math.random().toString(36).substr(2, 9)}`,
        rows: tableRows
      });

      tableBuffer = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line is part of a table
      const isTable = trimmed.includes('|') && (trimmed.match(/\|/g) || []).length >= 2;

      if (!trimmed) {
        pushTable();
        pushParagraph();
        continue;
      }

      if (isTable) {
        pushParagraph();
        tableBuffer.push(trimmed);
        continue;
      }

      if (trimmed.startsWith('### ')) {
        pushTable();
        pushParagraph();
        // Strip markdown bold syntax from headings
        const h3Text = trimmed.replace(/^###\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1');
        blocks.push({
          _type: 'block',
          style: 'h3',
          children: [{ _type: 'span', text: h3Text, marks: [] }]
        });
        continue;
      }

      if (trimmed.startsWith('## ')) {
        pushTable();
        pushParagraph();
        // Strip markdown bold syntax from headings
        const h2Text = trimmed.replace(/^##\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1');
        blocks.push({
          _type: 'block',
          style: 'h2',
          children: [{ _type: 'span', text: h2Text, marks: [] }]
        });
        continue;
      }

      if (trimmed.startsWith('- ')) {
        pushTable();
        pushParagraph();
        // Strip markdown bold syntax from list items
        const listText = trimmed.slice(2).trim().replace(/\*\*([^*]+)\*\*/g, '$1');
        blocks.push({
          _type: 'block',
          style: 'normal',
          listItem: 'bullet',
          children: [{ _type: 'span', text: listText, marks: [] }]
        });
        continue;
      }

      pushTable();
      paragraphBuffer.push(trimmed);
    }

    pushTable();
    pushParagraph();

    if (blocks.length === 0) {
      return [{
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: article, marks: [] }]
      }];
    }

    return blocks;
  }

  mergeQualityMetrics(existing, updates) {
    return {
      ...existing,
      ...updates
    };
  }

  simulatedResult(slug, reason = 'simulated', options = {}) {
    return {
      success: true,
      status: reason.startsWith('simulated') ? reason : `simulated-${reason}`,
      url:
        options.url ||
        `${(this.config.frontendBaseUrl || 'https://preview.plindia.com').replace(/\/$/, '')}/posts/${slug}`,
      deskUrl: options.deskUrl || '',
      documentId: options.documentId || ''
    };
  }

  safeSanityObject(obj) {
    const input = this.safeParseJSON(obj, obj && typeof obj === 'object' ? obj : {});
    const result = {};
    for (const [key, value] of Object.entries(input)) {
      const safeKey = key.replace(/^@/, 'schema_');
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[safeKey] = this.safeSanityObject(value);
      } else {
        result[safeKey] = value;
      }
    }
    return result;
  }

  buildFrontendUrl(slug) {
    const base = (this.config.frontendBaseUrl || '').trim();
    if (!base) {
      return `https://preview.plindia.com/drafts/${slug}`;
    }
    return `${base.replace(/\/$/, '')}/posts/${slug}`;
  }

  buildSanityDeskUrl(documentId) {
    if (!this.config.sanityProjectId) return '';
    const dataset = this.config.sanityDataset || 'production';
    return `https://sanity.io/${this.config.sanityProjectId}/${dataset}/desk/article;${documentId}`;
  }
}

module.exports = ContentPublisher;

// CLI usage
if (require.main === module) {
  const publisher = new ContentPublisher();
  publisher.publishAll()
    .then(() => console.log('🎉 Publication workflow finished!'))
    .catch(error => {
      console.error('❌ Publication failed:', error.message);
      process.exit(1);
    });
}
