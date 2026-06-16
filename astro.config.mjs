import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.billfanter.com',
  trailingSlash: 'never',

  build: {
    format: 'directory',
  },

  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/watchlist-confirmed') &&
        !page.includes('/2026') &&
        !page.includes('/classic') &&
        !page.includes('/sandbox'),
    }),
  ],

  redirects: {
    '/courses': '/',
    '/learn-on-demand': '/',
    '/options-foundation': '/',
    '/options-masterclass-module-1': '/',
    '/watchlist': '/free-watchlist',
    '/webinar2': '/webinar',
    '/options': '/',
    '/options-copy': '/',
    '/sw-lm-lp': '/free-watchlist',
    '/lm-watch': '/free-watchlist',
    '/masterclass2026': '/masterclass',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});