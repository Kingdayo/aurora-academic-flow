import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Aurora',
        short_name: 'Aurora',
        description: 'AI-Powered Academic Planner',
        theme_color: '#8B5CF6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // This is a temporary workaround because the .env.local file is not being loaded in the environment.
    // Replace this with a proper environment variable loading mechanism for production.
    'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify('BM2c4e5esqI0pBEC85FpD1WNP-pSRseC2aOwdS82iPmuG822hJ1eAD2r5sLq00pZYTscsT3z1FcoDslj5Z3jJ8s')
  }
});