import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,  // Windows에서 파일 변경 감지 문제 해결
      interval: 100,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
