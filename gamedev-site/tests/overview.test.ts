import { describe, expect, it } from 'vitest';
import { buildOverview, toMilestoneView } from '../src/lib/overview';
import type { MilestoneFullRow, WeekRow } from '../src/lib/types';

const settings = { start_date: '2026-11-30', weekly_target_hours: 22, public_show_hours: false };
const weeks: WeekRow[] = Array.from({ length: 104 }, (_, i) => ({
  n: i + 1,
  phase_id: 'f1',
  goal: `goal ${i + 1}`,
  status: i < 2 ? 'fatta' : 'da_fare',
  notes: null,
  link: null,
  updated_at: '',
}));
const milestone = (id: string, due: string, status: MilestoneFullRow['status'] = 'da_fare'): MilestoneFullRow => ({
  id,
  title_it: id,
  title_en: id,
  due_date: due,
  phase_id: 'f1',
  status,
  reached_date: null,
  notes: null,
  is_public: 1,
  sort_order: Number(id.slice(1)),
});

describe('buildOverview', () => {
  const sessions = [
    { date: '2026-11-30', minutes: 120 },
    { date: '2026-12-01', minutes: 60 },
    { date: '2026-12-08', minutes: 90 },
    { date: '2026-12-09', minutes: 30 },
  ];
  const milestones = [milestone('m01', '2026-12-13', 'raggiunto'), milestone('m02', '2027-03-28'), milestone('m03', '2026-12-01'), milestone('m04', '2027-06-01'), milestone('m05', '2027-07-01')];

  it('computes the current week, totals and chart', () => {
    const o = buildOverview({ today: '2026-12-09', settings, weeks, sessions, milestones });
    expect(o.planState).toBe('running');
    expect(o.currentWeek?.n).toBe(2);
    expect(o.currentWeek?.start).toBe('2026-12-07');
    expect(o.weekHours).toBe(2);
    expect(o.totals).toEqual({ hours: 5, weeksDone: 2, averageHours: 2.5, streakDays: 2 });
    expect(o.chart).toHaveLength(12);
    expect(o.chart[0]).toEqual({ n: 1, hours: 3 });
  });

  it('lists the next 3 unreached milestones by due date and suggests late ones', () => {
    const o = buildOverview({ today: '2026-12-09', settings, weeks, sessions, milestones });
    expect(o.nextMilestones.map((m) => m.id)).toEqual(['m03', 'm02', 'm04']);
    expect(o.nextMilestones[0]?.suggest_late).toBe(true);
    expect(o.nextMilestones[1]?.suggest_late).toBe(false);
  });

  it('handles the time before the start', () => {
    const o = buildOverview({ today: '2026-11-20', settings, weeks, sessions: [], milestones });
    expect(o.planState).toBe('not_started');
    expect(o.currentWeek).toBeNull();
    expect(o.chart.map((c) => c.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('shows the last 12 weeks later in the plan', () => {
    const o = buildOverview({ today: '2027-06-01', settings, weeks, sessions: [], milestones });
    expect(o.chart.at(-1)?.n).toBe(27);
    expect(o.chart[0]?.n).toBe(16);
  });
});

describe('toMilestoneView', () => {
  it('never suggests late for reached milestones', () => {
    expect(toMilestoneView(milestone('m01', '2020-01-01', 'raggiunto'), '2026-12-01').suggest_late).toBe(false);
  });
});
