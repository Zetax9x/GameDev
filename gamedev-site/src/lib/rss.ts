import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { t, path, type Lang } from '../i18n';
import { getPosts, postSlug } from './devlog';

export async function devlogFeed(lang: Lang, context: APIContext): Promise<Response> {
  const posts = await getPosts(lang);
  return rss({
    title: t(lang, 'rss.title'),
    description: t(lang, 'rss.description'),
    site: context.site ?? 'https://example.com',
    customData: `<language>${lang === 'it' ? 'it-it' : 'en-gb'}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: path(lang, 'devlog', postSlug(post)),
      categories: post.data.tags,
    })),
  });
}
