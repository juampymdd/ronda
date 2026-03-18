import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // En desarrollo no genera el SW para no interferir con hot-reload
  disable: process.env.NODE_ENV === "development",
  // Genera el SW aunque no haya assets que precachear
  register: true,
  // Workbox config: estrategias de cache
  workboxOptions: {
    // No precacheamos nada por ahora (el shell de Next.js se cachea sólo)
    // Las estrategias de runtime cache son las que importan
    runtimeCaching: [
      // Páginas — Network First: intenta red, si falla usa cache
      {
        urlPattern: /^https?.*(\/mozo|\/kds|\/ronda\/.*|\/admin\/.*|\/login).*$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "ronda-pages",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24, // 24hs
          },
          networkTimeoutSeconds: 10,
        },
      },
      // API de productos — Stale While Revalidate: cambia poco, no bloquea
      {
        urlPattern: /^https?.*\/api\/products.*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "ronda-api-products",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 2, // 2hs
          },
        },
      },
      // API de mesas — Network First: datos críticos, necesita estar actualizado
      {
        urlPattern: /^https?.*\/api\/tables.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "ronda-api-tables",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 5, // 5min
          },
          networkTimeoutSeconds: 5,
        },
      },
      // Imágenes y assets estáticos — Cache First: no cambian
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2|woff|ttf)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "ronda-static-assets",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
