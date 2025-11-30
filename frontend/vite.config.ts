import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true,
    // Force no caching in development
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    proxy: {
      // Proxy relayer requests to avoid CORS issues
      '/relayer-proxy': {
        target: 'https://relayer.testnet.zama.org', // ✅ CORRECT DOMAIN (.org not .cloud)
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/relayer-proxy/, ''),
        secure: true,
      },
    },
  },
});

