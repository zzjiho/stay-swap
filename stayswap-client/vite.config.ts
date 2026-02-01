import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis', // SockJS 호환성을 위한 global 정의
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Auth API는 auth 서버(8081)로 프록시
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // 나머지 API는 메인 서버(8080)로 프록시
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/stomp': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // WebSocket 프록시 활성화
      },
      '/oauth2': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/login/oauth2': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:8081',
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
