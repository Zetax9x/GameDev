import { currentWeek, phaseForWeek, round1, TOTAL_WEEKS, type PhaseLike } from './plan';

export type MilestoneStatus = 'da_fare' | 'in_corso' | 'raggiunto' | 'in_ritardo';

export interface MilestoneRow {
  id: string;
  status: MilestoneStatus;
  reached_date: string | null;
  is_public: number;
  sort_order: number;
  // Private field that must never leak to the public payload:
  notes?: string | null;
}

export interface PublicMilestone {
  id: string;
  status: MilestoneStatus;
  reached_date: string | null;
}

export interface PublicProgress {
  currentWeek: number;
  totalWeeks: number;
  currentPhaseId: string | null;
  milestones: { reached: number; total: number };
  publicMilestones: PublicMilestone[];
  totalHours?: number;
}

export interface PublicProgressInput {
  startDate: string;
  today: string;
  phases: readonly (PhaseLike & { id: string })[];
  milestones: readonly MilestoneRow[];
  showHours: boolean;
  totalMinutes: number;
}

/**
 * Builds the only payload exposed by /api/public/progress.
 * Whitelists fields explicitly: id, status, reached_date of public milestones,
 * plus aggregated counters. Nothing else.
 */
export function buildPublicProgress(input: PublicProgressInput): PublicProgress {
  const week = currentWeek(input.startDate, input.today);
  const publicRows = input.milestones
    .filter((m) => m.is_public === 1)
    .sort((a, b) => a.sort_order - b.sort_order);

  const result: PublicProgress = {
    currentWeek: week,
    totalWeeks: TOTAL_WEEKS,
    currentPhaseId: phaseForWeek(input.phases, week)?.id ?? null,
    milestones: {
      reached: publicRows.filter((m) => m.status === 'raggiunto').length,
      total: publicRows.length,
    },
    publicMilestones: publicRows.map((m) => ({
      id: m.id,
      status: m.status,
      reached_date: m.status === 'raggiunto' ? m.reached_date : null,
    })),
  };
  if (input.showHours) result.totalHours = round1(input.totalMinutes / 60);
  return result;
}
