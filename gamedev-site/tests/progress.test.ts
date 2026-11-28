import { describe, expect, it } from 'vitest';
import { buildPublicProgress, type MilestoneRow } from '../src/lib/progress';
import phasesJson from '../data/seed/fasi.json';

const milestones: MilestoneRow[] = [
  { id: 'm01', status: 'raggiunto', reached_date: '2026-12-12', is_public: 1, sort_order: 1, notes: 'secret' },
  { id: 'm02', status: 'in_corso', reached_date: null, is_public: 1, sort_order: 2, notes: 'secret' },
  { id: 'm10', status: 'raggiunto', reached_date: '2027-01-01', is_public: 0, sort_order: 10, notes: 'secret' },
  { id: 'm03', status: 'da_fare', reached_date: '2027-01-01', is_public: 1, sort_order: 3, title_it: 'x' } as MilestoneRow,
];

const base = {
  startDate: '2026-11-30',
  today: '2027-02-15',
  phases: phasesJson.phases,
  milestones,
  totalMinutes: 12_630,
};

describe('buildPublicProgress', () => {
  it('exposes only aggregated data and public milestones', () => {
    const out = buildPublicProgress({ ...base, showHours: false });
    expect(out).toEqual({
      currentWeek: 12,
      totalWeeks: 104,
      currentPhaseId: 'f3',
      milestones: { reached: 1, total: 3 },
      publicMilestones: [
        { id: 'm01', status: 'raggiunto', reached_date: '2026-12-12' },
        { id: 'm02', status: 'in_corso', reached_date: null },
        { id: 'm03', status: 'da_fare', reached_date: null },
      ],
    });
  });

  it('never leaks private fields', () => {
    const json = JSON.stringify(buildPublicProgress({ ...base, showHours: false }));
    expect(json).not.toContain('secret');
    expect(json).not.toContain('m10');
    expect(json).not.toContain('title_it');
    expect(json).not.toContain('totalHours');
  });

  it('adds total hours only when enabled', () => {
    expect(buildPublicProgress({ ...base, showHours: true }).totalHours).toBe(210.5);
  });
});
