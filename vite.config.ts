import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      srcDir: 'public',
      filename: 'sw.js',
      strategies: 'injectManifest',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB limit for AI models
        manifestTransforms: [
          (entries) => {
            // Filter out very large AI model files from precaching
            const filteredEntries = entries.filter(entry => {
              return !entry.url.includes('ort-wasm') && entry.size < 10 * 1024 * 1024;
            });
            return { manifest: filteredEntries };
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
