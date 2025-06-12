import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',  // listen on all network interfaces (disable host check)
      https: false, // disable HTTPS on localhost (use HTTP)
      cors: true,   // allow cross-origin requests
      // accept any trycloudflare.com subdomain
      allowedHosts: ['pay-converter-ky-determined.trycloudflare.com'],
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://proposal-pirates-today-jun.trycloudflare.com/api',
          changeOrigin: true,
          secure: isProd,
        }
      },
      ...(isProd && {
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Resource-Policy': 'same-site'
        }
      }),
    },
    build: {
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        }
      },
      // Cloudflare optimizations
      target: 'es2020',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@mui/material'],
            charts: ['recharts'],
          }
        }
      }
    },
  }
})
