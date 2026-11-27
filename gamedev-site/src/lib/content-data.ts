/** Build-time access to the public seed data (phases and milestones). */
import phasesJson from '../../data/seed/fasi.json';
import milestonesJson from '../../data/seed/traguardi.json';
import weeksJson from '../../data/seed/settimane.json';
import type { Lang } from '../i18n';

export interface Phase {
  id: string;
  order: number;
  name_it: string;
  name_en: string;
  weeks: [number, number] | null;
  parallel: boolean;
  label_it?: string;
  label_en?: string;
  summary_it: string;
  summary_en: string;
  gate_it: string | null;
  gate_en: string | null;
}

export interface MilestoneSeed {
  id: string;
  title_it: string;
  title_en: string;
  due_date: string;
  phase_id: string;
  is_public: boolean;
  sort_order: number;
}

export const PHASES = phasesJson.phases as Phase[];
export const MILESTONES = milestonesJson.milestones as MilestoneSeed[];
export const PUBLIC_MILESTONES = MILESTONES.filter((m) => m.is_public).sort((a, b) => a.sort_order - b.sort_order);

/** Default start date of the plan (the live value lives in D1 settings). */
export const DEFAULT_START_DATE: string = weeksJson.start_date;
export const DEFAULT_WEEKLY_TARGET: number = weeksJson.weekly_target_hours;

export function phaseName(phase: Phase, lang: Lang): string {
  return lang === 'it' ? phase.name_it : phase.name_en;
}

export function phaseById(id: string): Phase | undefined {
  return PHASES.find((p) => p.id === id);
}

export function localized<T extends Record<string, unknown>>(obj: T, field: string, lang: Lang): string {
  const value = obj[`${field}_${lang}`];
  return typeof value === 'string' ? value : '';
}
