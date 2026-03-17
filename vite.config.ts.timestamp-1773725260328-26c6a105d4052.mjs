// vite.config.ts
import { defineConfig } from "file:///C:/Users/admin/Desktop/complete_swetha_saiphani_frontend-master/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/admin/Desktop/complete_swetha_saiphani_frontend-master/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { compression } from "file:///C:/Users/admin/Desktop/complete_swetha_saiphani_frontend-master/node_modules/vite-plugin-compression2/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\admin\\Desktop\\complete_swetha_saiphani_frontend-master";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    // Generate gzip and brotli compressed assets for production
    mode === "production" && compression({
      algorithms: ["gzip", "brotliCompress"],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024
      // Only compress files > 1KB
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Enable minification with esbuild (built-in, fast)
    minify: "esbuild",
    // Enable source maps for debugging (optional - disable for smaller builds)
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
          "vendor-charts": ["recharts"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast"
          ]
        },
        // Optimize asset naming for long-term caching
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.(woff2?|ttf|eot|otf)$/.test(assetInfo.name)) {
            return "assets/fonts/[name]-[hash][extname]";
          }
          if (assetInfo.name && /\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return "assets/images/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js"
      }
    },
    // Target modern browsers for smaller bundles
    target: "es2020",
    // CSS code splitting
    cssCodeSplit: true
  },
  // Tree-shaking is enabled by default in Vite/Rollup
  // Ensure proper sideEffects handling
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhZG1pblxcXFxEZXNrdG9wXFxcXGNvbXBsZXRlX3N3ZXRoYV9zYWlwaGFuaV9mcm9udGVuZC1tYXN0ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFkbWluXFxcXERlc2t0b3BcXFxcY29tcGxldGVfc3dldGhhX3NhaXBoYW5pX2Zyb250ZW5kLW1hc3RlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWRtaW4vRGVza3RvcC9jb21wbGV0ZV9zd2V0aGFfc2FpcGhhbmlfZnJvbnRlbmQtbWFzdGVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcHJlc3Npb24gfSBmcm9tIFwidml0ZS1wbHVnaW4tY29tcHJlc3Npb24yXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogNTE3MyxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgICBwcm94eToge1xyXG4gICAgICBcIi9hcGlcIjoge1xyXG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjgwODBcIixcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgLy8gR2VuZXJhdGUgZ3ppcCBhbmQgYnJvdGxpIGNvbXByZXNzZWQgYXNzZXRzIGZvciBwcm9kdWN0aW9uXHJcbiAgICBtb2RlID09PSBcInByb2R1Y3Rpb25cIiAmJlxyXG4gICAgY29tcHJlc3Npb24oe1xyXG4gICAgICBhbGdvcml0aG1zOiBbXCJnemlwXCIsIFwiYnJvdGxpQ29tcHJlc3NcIl0sXHJcbiAgICAgIGV4Y2x1ZGU6IFsvXFwuKGJyKSQvLCAvXFwuKGd6KSQvXSxcclxuICAgICAgdGhyZXNob2xkOiAxMDI0LCAvLyBPbmx5IGNvbXByZXNzIGZpbGVzID4gMUtCXHJcbiAgICB9KSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gRW5hYmxlIG1pbmlmaWNhdGlvbiB3aXRoIGVzYnVpbGQgKGJ1aWx0LWluLCBmYXN0KVxyXG4gICAgbWluaWZ5OiBcImVzYnVpbGRcIixcclxuICAgIC8vIEVuYWJsZSBzb3VyY2UgbWFwcyBmb3IgZGVidWdnaW5nIChvcHRpb25hbCAtIGRpc2FibGUgZm9yIHNtYWxsZXIgYnVpbGRzKVxyXG4gICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgIC8vIENodW5rIHNpemUgd2FybmluZyBsaW1pdFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgXCJ2ZW5kb3ItcmVhY3RcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItcGRmXCI6IFtcImpzcGRmXCIsIFwianNwZGYtYXV0b3RhYmxlXCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItY2hhcnRzXCI6IFtcInJlY2hhcnRzXCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItcXVlcnlcIjogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItdWlcIjogW1xyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvYXN0XCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gT3B0aW1pemUgYXNzZXQgbmFtaW5nIGZvciBsb25nLXRlcm0gY2FjaGluZ1xyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XHJcbiAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgJiYgL1xcLih3b2ZmMj98dHRmfGVvdHxvdGYpJC8udGVzdChhc3NldEluZm8ubmFtZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiYXNzZXRzL2ZvbnRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1cIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChhc3NldEluZm8ubmFtZSAmJiAvXFwuKHBuZ3xqcGU/Z3xnaWZ8c3ZnfHdlYnB8aWNvKSQvLnRlc3QoYXNzZXRJbmZvLm5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcImFzc2V0cy9pbWFnZXMvW25hbWVdLVtoYXNoXVtleHRuYW1lXVwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIFwiYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1cIjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiBcImFzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzXCIsXHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanNcIixcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzIGZvciBzbWFsbGVyIGJ1bmRsZXNcclxuICAgIHRhcmdldDogXCJlczIwMjBcIixcclxuICAgIC8vIENTUyBjb2RlIHNwbGl0dGluZ1xyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gIH0sXHJcbiAgLy8gVHJlZS1zaGFraW5nIGlzIGVuYWJsZWQgYnkgZGVmYXVsdCBpbiBWaXRlL1JvbGx1cFxyXG4gIC8vIEVuc3VyZSBwcm9wZXIgc2lkZUVmZmVjdHMgaGFuZGxpbmdcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVgsU0FBUyxvQkFBb0I7QUFDdFosT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLG1CQUFtQjtBQUg1QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUVOLFNBQVMsZ0JBQ1QsWUFBWTtBQUFBLE1BQ1YsWUFBWSxDQUFDLFFBQVEsZ0JBQWdCO0FBQUEsTUFDckMsU0FBUyxDQUFDLFdBQVcsU0FBUztBQUFBLE1BQzlCLFdBQVc7QUFBQTtBQUFBLElBQ2IsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQTtBQUFBLElBRVIsV0FBVztBQUFBO0FBQUEsSUFFWCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsY0FBYyxDQUFDLFNBQVMsaUJBQWlCO0FBQUEsVUFDekMsaUJBQWlCLENBQUMsVUFBVTtBQUFBLFVBQzVCLGdCQUFnQixDQUFDLHVCQUF1QjtBQUFBLFVBQ3hDLGFBQWE7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBO0FBQUEsUUFFQSxnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGNBQUksVUFBVSxRQUFRLDBCQUEwQixLQUFLLFVBQVUsSUFBSSxHQUFHO0FBQ3BFLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksVUFBVSxRQUFRLGtDQUFrQyxLQUFLLFVBQVUsSUFBSSxHQUFHO0FBQzVFLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFFBQVE7QUFBQTtBQUFBLElBRVIsY0FBYztBQUFBLEVBQ2hCO0FBQUE7QUFBQTtBQUFBLEVBR0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxFQUNwRDtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
