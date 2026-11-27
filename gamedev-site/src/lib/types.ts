/** Shapes shared by the private API and the dashboard. */
import type { MilestoneStatus } from './progress';

export type WeekStatus = 'da_fare' | 'in_corso' | 'fatta' | 'saltata';

export interface Settings {
  start_date: string;
  weekly_target_hours: number;
  public_show_hours: boolean;
}

export interface SessionRow {
  id: number;
  date: string;
  minutes: number;
  category: string;
  note: string | null;
  link: string | null;
  created_at: string;
}

export interface WeekRow {
  n: number;
  phase_id: string;
  goal: string;
  status: WeekStatus;
  notes: string | null;
  link: string | null;
  updated_at: string;
}

export interface WeekView extends WeekRow {
  start: string;
  end: string;
  hours: number;
}

export interface MilestoneFullRow {
  id: string;
  title_it: string;
  title_en: string;
  due_date: string;
  phase_id: string;
  status: MilestoneStatus;
  reached_date: string | null;
  notes: string | null;
  is_public: number;
  sort_order: number;
}

export interface MilestoneView extends Omit<MilestoneFullRow, 'is_public'> {
  is_public: boolean;
  /** Due date passed and not reached: suggest "in_ritardo" (never set automatically). */
  suggest_late: boolean;
}

export interface Overview {
  today: string;
  settings: Settings;
  planState: 'not_started' | 'running' | 'completed';
  currentWeek: WeekView | null;
  weekHours: number;
  totals: {
    hours: number;
    weeksDone: number;
    averageHours: number;
    streakDays: number;
  };
  chart: { n: number; hours: number }[];
  nextMilestones: MilestoneView[];
}
