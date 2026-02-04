import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3007,
    host: true,
    proxy: {
      // Proxy API requests to the Enhanced Bulk Generator backend server
      '/api/workflow': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
      '/api/convert': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
      // Proxy API requests to the Social Media backend (via backend-server.js on port 3006)
      '/api/workflow/social-media': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
      '/api/avatars': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
          '/api/health/social-media': {
            target: 'http://localhost:3008',
            changeOrigin: true,
            secure: false,
          },
          '/api/topic/generate': {
            target: 'http://localhost:3008',
            changeOrigin: true,
            secure: false,
          },
      // Proxy API requests to the Video Gen backend (via backend-server.js on port 3006)
      '/api/video-gen': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
      // Proxy GTM strategy endpoints
      '/api/gtm': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
