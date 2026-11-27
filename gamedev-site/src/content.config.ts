import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Devlog posts: src/content/devlog/{it,en}/*.md
 * The entry id is "<lang>/<slug>"; the slug is the file name.
 */
const devlog = defineCollection({
  loader: glob({ pattern: '{it,en}/**/*.md', base: './src/content/devlog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160),
      date: z.coerce.date(),
      tags: z.array(z.string().regex(/^[a-z0-9-]+$/, 'Tags must be lowercase')).default([]),
      translationKey: z.string(),
      draft: z.boolean().default(false),
      cover: image().optional(),
      project: z.string().optional(),
    }),
});

const status = z.enum(['planned', 'in_progress', 'done']);

/** Projects come from data/seed/progetti.json. */
const projects = defineCollection({
  loader: file('data/seed/progetti.json', {
    parser: (text) => {
      const data = JSON.parse(text) as { projects: Array<Record<string, unknown> & { slug: string }> };
      return data.projects.map((p) => ({ id: p.slug, ...p }));
    },
  }),
  schema: z.object({
    slug: z.string(),
    name_it: z.string(),
    name_en: z.string(),
    phase_id: z.string(),
    status,
    tech: z.array(z.string()),
    summary_it: z.string(),
    summary_en: z.string(),
    learned_it: z.string().nullish(),
    learned_en: z.string().nullish(),
    github: z.url().nullable(),
    itch: z.url().nullable(),
    video: z.url().nullable(),
    // Path of an image/GIF in /public (e.g. "/projects/pong.gif"), or null for the drawn placeholder.
    cover: z.string().nullable(),
    screenshots: z.array(z.string()).default([]),
    featured: z.boolean(),
    hidden: z.boolean(),
    weeks: z.tuple([z.number().int(), z.number().int()]),
  }),
});

export const collections = { devlog, projects };
