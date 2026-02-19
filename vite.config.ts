import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";
import fs from "fs";

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const appVersion = packageJson.version || "1.0.0";

// Plugin to inject version into HTML
const versionInjectionPlugin = (): Plugin => {
  return {
    name: "version-injection",
    transformIndexHtml(html: string) {
      return html.replace(
        '<meta name="app-version" content="1.0.0" />',
        `<meta name="app-version" content="${appVersion}" />`
      );
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    versionInjectionPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        manualChunks: undefined,
      }
    },
    sourcemap: false,
    minify: 'esbuild',
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
