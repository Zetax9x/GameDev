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
  trailingSlash: 'ignore',
  // No Astro sessions and no Cloudflare Images binding: nothing extra to provision, nothing billed.
  session: false,
  adapter: cloudflare({ imageService: { build: 'compile', runtime: 'passthrough' } }),
  // Content-Security-Policy as a <meta> tag with hashes of every script and style Astro emits.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/dashboard') && !page.includes('/api/'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', it: 'it' } },
    }),
  ],
  markdown: {
    // Prism uses CSS classes (Shiki's inline styles would be blocked by the CSP).
    syntaxHighlight: 'prism',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
