import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Sentry source map upload — apenas em produção com SENTRY_AUTH_TOKEN
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || 'acai-wave',
      project: process.env.SENTRY_PROJECT || 'acai-wave-pdv',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Não envia dados de telemetria do plugin
      telemetry: false,
      // Silencia logs do plugin (evita poluição no output do build)
      silent: true,
      sourcemaps: {
        // Apaga os source maps após o upload para não publicar no bundle
        assets: './dist/assets/**',
        ignore: ['./node_modules/**'],
        // Deleta os arquivos .map após o upload bem-sucedido
        deleteSourcemapsAfterUpload: true,
      },
      release: {
        name: process.env.VITE_APP_VERSION || 'unknown',
      },
    }),
    visualizer({
      filename: 'dist/bundle-report.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: './',
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // strictPort: true causa conflitos quando outra instância está rodando
    // tryPorts permite fallback automático para 5174, 5175
    strictPort: false,
    tryPorts: [5173, 5174, 5175],
  },
  build: {
    // Ofuscação de produção: torna o código ilegível e remove debug
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
        ascii_only: true,
      },
    },
    // Source maps em produção: gerados mas não publicados no bundle
    // Eles são enviados ao Sentry via @sentry/vite-plugin (upload automático)
    // e ficam disponíveis apenas no servidor do Sentry para debug
    sourcemap: true,
    // Code splitting: manual chunks for better caching and lazy loading
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core - rarely changes, good for caching
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // PDF generation - heavy library, load only when needed
          if (id.includes('node_modules/pdfmake')) {
            return 'pdf-vendor';
          }
          // State management
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
})
