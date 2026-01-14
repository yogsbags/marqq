/**
 * Hero Image Generator Integration
 * Wraps OpenAI image generation with graceful fallbacks for bulk workflows.
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');

const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const DEFAULT_MODEL = 'dall-e-3';
const DEFAULT_SIZE = '1024x1024';  // Square format - will be resized to 450x450 (cheaper & smaller)
const DEFAULT_STYLE = 'natural';
const DEFAULT_QUALITY = 'standard';

const OUTPUT_DIR = path.resolve(__dirname, '../data/generated-hero-images');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function buildResult(status, payload = {}) {
  return {
    status,
    provider: payload.provider || 'openai-dall-e-3',
    prompt: payload.prompt || '',
    topic_id: payload.topicId || null,
    url: payload.url || null,                     // Primary URL (imgbb > local > DALL-E)
    hosted_url: payload.hostedUrl || null,        // imgbb CDN URL
    local_path: payload.localPath || null,        // Local fallback path
    dalle_url: payload.dalleUrl || null,          // Original DALL-E URL
    generated_at: payload.generatedAt || new Date().toISOString(),
    reason: payload.reason || null,
    metadata: payload.metadata || {},
  };
}

/**
 * Upload image buffer to imgbb CDN
 * @param {Buffer} imageBuffer - The image buffer to upload
 * @param {string} filename - Name for the uploaded file
 * @param {string} apiKey - imgbb API key (defaults to env var)
 * @returns {Promise<string>} - Permanent imgbb hosted URL
 */
async function uploadToImgbb(imageBuffer, filename, apiKey = process.env.IMGBB_API_KEY) {
  if (!apiKey) {
    throw new Error('imgbb API key not provided');
  }

  try {
    // Convert buffer to base64 (imgbb accepts base64)
    const base64Image = imageBuffer.toString('base64');

    const form = new FormData();
    form.append('key', apiKey);
    form.append('image', base64Image);
    form.append('name', filename);

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: form
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(`imgbb upload failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data.data.url;  // Returns permanent CDN URL (e.g., https://i.ibb.co/abc123/image.png)
  } catch (error) {
    console.warn(`⚠️  imgbb upload error: ${error.message}`);
    throw error;
  }
}

/**
 * Download and process image with dual storage (imgbb + local fallback)
 * @param {string} url - DALL-E image URL
 * @param {string} filename - Base filename
 * @returns {Promise<Object>} - Object with hosted_url and local_path
 */
async function downloadImage(url, filename) {
  if (!url) return null;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.buffer();
  const safeName = filename.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();

  // Resize and compress image using sharp (in-memory)
  const resizedBuffer = await sharp(buffer)
    .png({
      quality: 85,           // Quality: 0-100 (85 is good balance)
      compressionLevel: 9,   // Max compression: 0-9
      palette: true          // Use palette-based optimization
    })
    .resize(450, 450, {     // Small square blog-friendly size (1:1 ratio)
      fit: 'cover',
      position: 'center'
    })
    .toBuffer();           // Returns buffer instead of writing to disk

  // Primary: Upload to imgbb for permanent CDN hosting
  let hostedUrl = null;
  try {
    hostedUrl = await uploadToImgbb(resizedBuffer, safeName);
    console.log(`   ✓ imgbb upload successful: ${hostedUrl}`);
  } catch (error) {
    console.warn(`   ⚠️  imgbb upload failed, will use local fallback`);
  }

  // Fallback: Save to local disk (for local development or imgbb failure)
  let localPath = null;
  try {
    ensureOutputDir();
    localPath = path.join(OUTPUT_DIR, `${safeName}-${Date.now()}.png`);
    await sharp(resizedBuffer).toFile(localPath);
    console.log(`   ✓ Local backup saved: ${localPath}`);
  } catch (error) {
    console.warn(`   ⚠️  Local save failed: ${error.message}`);
  }

  // Return both URLs (hosted_url takes priority)
  return {
    hosted_url: hostedUrl,
    local_path: localPath,
    primary_url: hostedUrl || localPath  // Priority: imgbb > local
  };
}

async function generateHeroImage(options = {}) {
  const {
    prompt,
    topicId,
    title,
    focusKeyword,
    apiKey = process.env.OPENAI_API_KEY,
    size = DEFAULT_SIZE,
    quality = DEFAULT_QUALITY,
    style = DEFAULT_STYLE,
    model = DEFAULT_MODEL,
    saveToDisk = false,
  } = options;

  if (!prompt) {
    return buildResult('skipped', {
      prompt: '',
      topicId,
      reason: 'missing_prompt',
    });
  }

  if (!apiKey) {
    return buildResult('skipped', {
      prompt,
      topicId,
      reason: 'missing_api_key',
    });
  }

  try {
    const response = await fetch(OPENAI_IMAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
        style,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI image error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const imageData = data?.data?.[0];

    if (!imageData?.url) {
      throw new Error('OpenAI image response missing URL');
    }

    let imageUrls = null;
    if (saveToDisk) {
      const filename = topicId || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'hero-image');
      imageUrls = await downloadImage(imageData.url, filename);
    }

    return buildResult('generated', {
      prompt: imageData.revised_prompt || prompt,
      topicId,
      url: imageUrls?.primary_url || imageData.url,  // Priority: imgbb > local > DALL-E
      hostedUrl: imageUrls?.hosted_url || null,       // imgbb CDN URL
      localPath: imageUrls?.local_path || null,       // Local fallback path
      dalleUrl: imageData.url,                        // Original DALL-E URL (for reference)
      generatedAt: new Date().toISOString(),
      metadata: {
        title,
        focusKeyword,
        size,
        quality,
        style,
        model,
      },
    });
  } catch (error) {
    return buildResult('error', {
      prompt,
      topicId,
      reason: 'request_failed',
      metadata: {
        message: error.message,
        title,
        focusKeyword,
      },
    });
  }
}

module.exports = {
  generateHeroImage,
};
