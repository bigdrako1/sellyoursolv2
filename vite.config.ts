
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add optimizeDeps and build options for better compatibility
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-switch'],
          'vendor-charts': ['recharts', 'd3', 'd3-geo'],
          'vendor-utils': ['date-fns', 'lodash', 'uuid'],
          'vendor-crypto': ['@solana/web3.js', '@solana/wallet-adapter-react', 'crypto-js'],
        }
      }
    }
  }
}));
