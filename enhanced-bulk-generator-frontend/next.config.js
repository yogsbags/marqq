/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable image optimization for Netlify
  images: {
    unoptimized: true,
  },
  // Experimental features for Next.js 14
  experimental: {
    // Externalize server packages to prevent bundling issues
    serverComponentsExternalPackages: ['child_process'],
    // Include backend workflow files in serverless function bundles
    // This tells Next.js to copy these files when deploying API routes
    outputFileTracingIncludes: {
      '/api/workflow/execute': [
        '../main.js',
        '../core/**/*',
        '../research/**/*',
        '../content/**/*',
        '../data/**/*',
        '../package.json',
        '../node_modules/**/*',
      ],
      '/api/workflow/stage': [
        '../main.js',
        '../core/**/*',
        '../research/**/*',
        '../content/**/*',
        '../data/**/*',
        '../package.json',
        '../node_modules/**/*',
      ],
    },
  },
}

module.exports = nextConfig
