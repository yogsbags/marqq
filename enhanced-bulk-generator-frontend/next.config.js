/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable image optimization for Netlify
  images: {
    unoptimized: true,
  },
  // Externalize server packages (no longer experimental in Next.js 16)
  serverComponentsExternalPackages: ['child_process'],
  // Experimental features for Next.js 16
  experimental: {
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
