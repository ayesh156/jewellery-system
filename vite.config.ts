import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Icons library (often large)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Other vendor libraries
            return 'vendor';
          }
          
          // Split pages into separate chunks by module
          if (id.includes('/src/pages/')) {
            // Pawning module
            if (id.includes('Pawn') || id.includes('PayInterest') || id.includes('Redeem')) {
              return 'pages-pawning';
            }
            // Repair module
            if (id.includes('Repair')) {
              return 'pages-repairs';
            }
            // Invoice/Sales module
            if (id.includes('Invoice') || id.includes('Sales')) {
              return 'pages-invoices';
            }
            // GRN module
            if (id.includes('GRN')) {
              return 'pages-grn';
            }
            // Other pages
            return 'pages-misc';
          }
          
          // Split printable components
          if (id.includes('/src/components/Printable')) {
            return 'printables';
          }
          
          // Split mock data (often large)
          if (id.includes('/src/data/')) {
            return 'mock-data';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
