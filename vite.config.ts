import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-separator', '@radix-ui/react-slot'],
        },
      },
    },
  },
  // Note: Proxy only works in development, not in production
  // For production, use direct MCP server URL in environment variables
  server: {
    proxy: {
      '/api/mcp': {
        target: 'https://apollo.composio.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp/, '/v3/mcp/f61fe1ab-bd1b-4562-8f12-d9449d4febce/mcp'),
        secure: false,
        ws: true, // Enable WebSocket proxying
      }
    }
  }
})