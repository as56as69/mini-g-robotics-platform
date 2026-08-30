import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robot-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'منصة ميني جي للروبوتكس والبرمجة',
        short_name: 'Mini G Platform',
        description: 'منصة تفاعلية لتعليم البرمجة والروبوتكس للأطفال مع التوأم الرقمي وبلوتوث BLE',
        theme_color: '#7c3aed',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // School hub API (Express + JSON file server on PORT=3300)
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3300',
        changeOrigin: true
      }
    }
  }
});
