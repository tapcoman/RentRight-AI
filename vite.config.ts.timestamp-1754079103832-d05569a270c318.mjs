// vite.config.ts
import { defineConfig } from "file:///Users/jaydanbis/Desktop/RentRight-AI/node_modules/vite/dist/node/index.js";
import react from "file:///Users/jaydanbis/Desktop/RentRight-AI/node_modules/@vitejs/plugin-react/dist/index.mjs";
import themePlugin from "file:///Users/jaydanbis/Desktop/RentRight-AI/node_modules/@replit/vite-plugin-shadcn-theme-json/dist/index.mjs";
import path, { dirname } from "path";
import runtimeErrorOverlay from "file:///Users/jaydanbis/Desktop/RentRight-AI/node_modules/@replit/vite-plugin-runtime-error-modal/dist/index.mjs";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/jaydanbis/Desktop/RentRight-AI/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("file:///Users/jaydanbis/Desktop/RentRight-AI/node_modules/@replit/vite-plugin-cartographer/dist/index.mjs").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamF5ZGFuYmlzL0Rlc2t0b3AvUmVudFJpZ2h0LUFJXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvamF5ZGFuYmlzL0Rlc2t0b3AvUmVudFJpZ2h0LUFJL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9qYXlkYW5iaXMvRGVza3RvcC9SZW50UmlnaHQtQUkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHRoZW1lUGx1Z2luIGZyb20gXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLXNoYWRjbi10aGVtZS1qc29uXCI7XG5pbXBvcnQgcGF0aCwgeyBkaXJuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCBydW50aW1lRXJyb3JPdmVybGF5IGZyb20gXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLXJ1bnRpbWUtZXJyb3ItbW9kYWxcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBkaXJuYW1lKF9fZmlsZW5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBydW50aW1lRXJyb3JPdmVybGF5KCksXG4gICAgdGhlbWVQbHVnaW4oKSxcbiAgICAuLi4ocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiICYmXG4gICAgcHJvY2Vzcy5lbnYuUkVQTF9JRCAhPT0gdW5kZWZpbmVkXG4gICAgICA/IFtcbiAgICAgICAgICBhd2FpdCBpbXBvcnQoXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLWNhcnRvZ3JhcGhlclwiKS50aGVuKChtKSA9PlxuICAgICAgICAgICAgbS5jYXJ0b2dyYXBoZXIoKSxcbiAgICAgICAgICApLFxuICAgICAgICBdXG4gICAgICA6IFtdKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJjbGllbnRcIiwgXCJzcmNcIiksXG4gICAgICBcIkBzaGFyZWRcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzaGFyZWRcIiksXG4gICAgfSxcbiAgfSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJjbGllbnRcIiksXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImRpc3QvcHVibGljXCIpLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlTLFNBQVMsb0JBQW9CO0FBQzlULE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFFBQVEsZUFBZTtBQUM5QixPQUFPLHlCQUF5QjtBQUNoQyxTQUFTLHFCQUFxQjtBQUxvSixJQUFNLDJDQUEyQztBQU9uTyxJQUFNLGFBQWEsY0FBYyx3Q0FBZTtBQUNoRCxJQUFNLFlBQVksUUFBUSxVQUFVO0FBRXBDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLG9CQUFvQjtBQUFBLElBQ3BCLFlBQVk7QUFBQSxJQUNaLEdBQUksUUFBUSxJQUFJLGFBQWEsZ0JBQzdCLFFBQVEsSUFBSSxZQUFZLFNBQ3BCO0FBQUEsTUFDRSxNQUFNLE9BQU8sMkdBQWtDLEVBQUU7QUFBQSxRQUFLLENBQUMsTUFDckQsRUFBRSxhQUFhO0FBQUEsTUFDakI7QUFBQSxJQUNGLElBQ0EsQ0FBQztBQUFBLEVBQ1A7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLFdBQVcsVUFBVSxLQUFLO0FBQUEsTUFDNUMsV0FBVyxLQUFLLFFBQVEsV0FBVyxRQUFRO0FBQUEsSUFDN0M7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNLEtBQUssUUFBUSxXQUFXLFFBQVE7QUFBQSxFQUN0QyxPQUFPO0FBQUEsSUFDTCxRQUFRLEtBQUssUUFBUSxXQUFXLGFBQWE7QUFBQSxJQUM3QyxhQUFhO0FBQUEsRUFDZjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
