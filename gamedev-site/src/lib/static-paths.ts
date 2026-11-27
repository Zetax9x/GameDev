import { getCollection } from 'astro:content';
import type { Lang } from '../i18n';
import { allTags, getPosts, postLang, postSlug, type Post } from './devlog';
import { getProjects, type Project } from './projects';

export type DevlogPathProps = { post: Post; missing: false } | { post: Post; missing: true };

/**
 * Paths for /<lang>/devlog/<slug>/: every published post of the language, plus a
 * "missing translation" page for posts that exist only in the other language.
 */
export async function devlogPaths(lang: Lang) {
  const own = await getPosts(lang);
  const ownKeys = new Set(own.map((p) => p.data.translationKey));
  const ownSlugs = new Set(own.map(postSlug));
  const others = await getCollection('devlog', (p) => !p.data.draft && postLang(p) !== lang);

  const paths: { params: { slug: string }; props: DevlogPathProps }[] = own.map((post) => ({
    params: { slug: postSlug(post) },
    props: { post, missing: false },
  }));
  for (const post of others) {
    const slug = postSlug(post);
    if (ownKeys.has(post.data.translationKey) || ownSlugs.has(slug)) continue;
    paths.push({ params: { slug }, props: { post, missing: true } });
  }
  return paths;
}

export async function tagPaths(lang: Lang) {
  return allTags(await getPosts(lang)).map((tag) => ({ params: { tag }, props: { tag } }));
}

export async function projectPaths(): Promise<{ params: { slug: string }; props: { project: Project } }[]> {
  return (await getProjects()).map((project) => ({ params: { slug: project.data.slug }, props: { project } }));
}
