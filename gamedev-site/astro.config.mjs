// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Public URL of the site. Update it when the Worker name / custom domain is final.
const SITE = process.env.SITE_URL ?? 'https://yuri-gamedev.workers.dev';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  // No Astro sessions and no Cloudflare Images binding: nothing extra to provision, nothing billed.
  session: false,
  adapter: cloudflare({ imageService: { build: 'compile', runtime: 'passthrough' } }),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/dashboard') && !page.includes('/api/'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', it: 'it' } },
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
