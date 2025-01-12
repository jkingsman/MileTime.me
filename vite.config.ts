import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    // add this to cache all the imports
    workbox: {
      globPatterns: ["**/*"],
    },
    // add this to cache all the
    // static assets in the public folder
    includeAssets: [
      "**/*",
    ],
    manifest: {
      "name": "MileTime.me",
      "short_name": "MileTime.me",
      "scope": "/",
      "start_url": "/",
      "icons": [
        {
          "src": "/web-app-manifest-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable"
        },
        {
          "src": "/web-app-manifest-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable"
        }
      ],
      "theme_color": "#ffffff",
      "background_color": "#ffffff",
      "display": "standalone"
    }
  })],
})
