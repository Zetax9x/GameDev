import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n';

export type Project = CollectionEntry<'projects'>;
export type ProjectStatus = Project['data']['status'];

export const PROJECT_STATUSES: ProjectStatus[] = ['in_progress', 'done', 'planned'];

/** Visible projects ordered by start week. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', (p) => !p.data.hidden);
  return all.sort((a, b) => a.data.weeks[0] - b.data.weeks[0]);
}

/** Up to 3 featured projects, otherwise the most recent ones not planned. */
export async function getHomeProjects(): Promise<Project[]> {
  const all = await getProjects();
  const featured = all.filter((p) => p.data.featured);
  if (featured.length > 0) return featured.slice(0, 3);
  return all
    .filter((p) => p.data.status !== 'planned')
    .sort((a, b) => b.data.weeks[0] - a.data.weeks[0])
    .slice(0, 3);
}

export function projectName(p: Project, lang: Lang): string {
  return lang === 'it' ? p.data.name_it : p.data.name_en;
}

export function projectSummary(p: Project, lang: Lang): string {
  return lang === 'it' ? p.data.summary_it : p.data.summary_en;
}

export function statusClass(status: ProjectStatus): string {
  return status === 'done' ? 'status-done' : status === 'in_progress' ? 'status-progress' : 'status-muted';
}
