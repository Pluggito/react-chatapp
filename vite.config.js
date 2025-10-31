import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // ✅ Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  // ✅ Debug logs to verify env vars are loaded
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🏗️  Building with mode:', mode)
  console.log('🔗 API URL:', env.VITE_API_BASE_URL)
  console.log('📡 Socket URL:', env.VITE_SOCKET_URL)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return {
    plugins: [react(), tailwindcss()],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    base: './',
    
    assetsInclude: ['**/*.PNG', '**/*.JPG', '**/*.jpg', '**/*.png'],
    
    build: {
      outDir: "dist",
      // ✅ Generate sourcemaps for debugging production issues
      sourcemap: mode === 'development',
      // ✅ Minify in production
      minify: mode === 'production',
      // ✅ Show rollup warnings
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            socket: ['socket.io-client']
          }
        }
      }
    },
    
    server: {
      port: 5173,
      historyApiFallback: true,
      // ✅ Optional: Proxy API requests in development to avoid CORS
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3050',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },

    // ✅ CRITICAL: Explicitly define env vars to be embedded in the build
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_SOCKET_URL': JSON.stringify(env.VITE_SOCKET_URL),
      // ✅ Add __DEV__ flag for conditional logic
      __DEV__: mode === 'development',
    },

    // ✅ Ensure env vars are loaded
    envPrefix: 'VITE_',
  }
})