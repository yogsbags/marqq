const fs = require('fs');
const path = require('path');

/**
 * Get Google Application Credentials
 * On Railway: Supports both GOOGLE_CREDENTIALS_JSON and GOOGLE_APPLICATION_CREDENTIALS_BASE64
 * Locally: Uses file path from GOOGLE_APPLICATION_CREDENTIALS
 *
 * This allows Railway deployments to work without needing file uploads
 */
function getGoogleCredentials() {
  // Railway deployment (JSON credentials - used by Google Sheets sync)
  if (process.env.GOOGLE_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      // Validate it's valid JSON
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

      // Write to temp file for Google SDKs that expect file paths
      const tempPath = '/tmp/google-credentials.json';
      fs.writeFileSync(tempPath, JSON.stringify(credentials, null, 2));

      // Set env var for Google SDKs that expect file paths
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;

      console.log('✅ Google credentials from GOOGLE_CREDENTIALS_JSON → /tmp/google-credentials.json');
      console.log(`   Service account: ${credentials.client_email || 'unknown'}`);
      return tempPath;
    } catch (error) {
      console.warn(`⚠️  Failed to parse GOOGLE_CREDENTIALS_JSON: ${error.message}`);
      console.warn('   Make sure it contains valid JSON (not base64 encoded)');
      return null;
    }
  }

  // Railway deployment (base64 encoded - legacy support)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    try {
      const credentialsJson = Buffer.from(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
        'base64'
      ).toString('utf-8');

      // Write to temp file
      const tempPath = '/tmp/google-credentials.json';
      fs.writeFileSync(tempPath, credentialsJson);

      // Set env var for Google SDKs
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;

      console.log('✅ Google credentials decoded from base64 → /tmp/google-credentials.json');
      return tempPath;
    } catch (error) {
      console.warn(`⚠️  Failed to decode base64 credentials: ${error.message}`);
      return null;
    }
  }

  // Local development (file path)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (fs.existsSync(credPath)) {
      console.log(`✅ Using local Google credentials file: ${credPath}`);
      return credPath;
    } else {
      console.warn(`⚠️  Google credentials file not found: ${credPath}`);
      return null;
    }
  }

  console.log('ℹ️  Google Application Credentials not configured (optional for AI-only mode)');
  return null;
}

module.exports = { getGoogleCredentials };
