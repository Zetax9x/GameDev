import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n';

export type Post = CollectionEntry<'devlog'>;

export function postLang(post: Post): Lang {
  return post.id.startsWith('it/') ? 'it' : 'en';
}

export function postSlug(post: Post): string {
  return post.id.split('/').slice(1).join('/');
}

/** Published posts of a language (drafts excluded), newest first. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const all = await getCollection('devlog', (p) => !p.data.draft && postLang(p) === lang);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** The same post in the other language, if published. */
export async function getTranslation(post: Post): Promise<Post | undefined> {
  const lang = postLang(post);
  const other = await getCollection(
    'devlog',
    (p) => !p.data.draft && postLang(p) !== lang && p.data.translationKey === post.data.translationKey,
  );
  return other[0];
}

/** Reading time at ~220 words per minute, minimum 1. */
export function readingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function allTags(posts: readonly Post[]): string[] {
  return [...new Set(posts.flatMap((p) => p.data.tags))].sort();
}
