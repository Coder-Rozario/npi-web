import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      threshold: 10240,
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 10240,
      ext: '.br',
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://npi.edu.bd',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://npi.edu.bd',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    chunkSizeWarningLimit: 1200,
    reportCompressedSize: false,
    // Optimize assets better
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-animation': ['framer-motion', 'aos'],
          'vendor-ui': ['react-icons', 'lucide-react', '@fortawesome/react-fontawesome'],
          'vendor-form': ['react-quill', 'jodit-react'],
          'vendor-other': ['axios', 'react-helmet-async', 'react-countup', 'typewriter-effect'],
          // Separate routes for code splitting
          'route-admin': ['./src/Admin/Admin.jsx'],
          'route-about': ['./src/Pages/About/About.jsx'],
          'route-departments': ['./src/Pages/Departments/Departments.jsx'],
          'route-academic': ['./src/Pages/Academic/Academic.jsx'],
          'route-gallery': ['./src/Pages/Gallery/Gallery.jsx'],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Optimize initial load with smaller chunks
        inlineDynamicImports: false
      },
      external: [],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    cssCodeSplit: true, // Split CSS per chunk
    sourcemap: false, // Disable sourcemaps in production for smaller build
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion'
    ]
  }
})
