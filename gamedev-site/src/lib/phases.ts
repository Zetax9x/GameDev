/** Phases of the plan (public data, safe to ship to the browser). */
import phasesJson from '../../data/seed/fasi.json';

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

export const PHASES = phasesJson.phases as Phase[];
