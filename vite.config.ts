import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.ngrok-free.app'],
  },
  build: {
    target: 'es2022',
    cssMinify: 'lightningcss',
  },
});
