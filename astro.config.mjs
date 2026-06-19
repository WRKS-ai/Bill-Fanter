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
      // Keep noindexed funnel / confirmation pages and preview routes out of the
      // sitemap (these also carry a noindex meta tag).
      filter: (page) =>
        !page.includes('/watchlist-confirmed') &&
        !page.includes('/watch-webinar') &&
        !page.includes('/blog') &&
        !page.includes('/booking') &&
        !page.includes('/guide') &&
        !page.includes('/training') &&
        !page.includes('/2026') &&
        !page.includes('/classic') &&
        !page.includes('/sandbox'),
      // Post-rebuild: stamp every URL with the build date and rank the money
      // pages higher. Google ignores priority, but other engines and AI
      // crawlers still read it.
      serialize(item) {
        item.lastmod = new Date().toISOString();
        const url = item.url;
        if (url === 'https://www.billfanter.com' || url === 'https://www.billfanter.com/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (/\/(masterclass|community|webinar|free-watchlist)(\/|$)/.test(url)) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (/\/(about|contact|student-comments|blog)(\/|$)/.test(url)) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (/\/(privacy-policy|terms-conditions|refund-policy)(\/|$)/.test(url)) {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        } else {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
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