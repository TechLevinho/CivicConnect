import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Define server port for API
const SERVER_PORT = 3011;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
      }
    }
  }
}); 