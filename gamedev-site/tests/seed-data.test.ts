import { describe, expect, it } from 'vitest';
import phasesJson from '../data/seed/fasi.json';
import weeksJson from '../data/seed/settimane.json';
import milestonesJson from '../data/seed/traguardi.json';
import projectsJson from '../data/seed/progetti.json';
import { PLAN_MONTHS, monthForWeek } from '../src/lib/checks-data';
import { weekRange } from '../src/lib/plan';

const phaseIds = new Set(phasesJson.phases.map((p) => p.id));

describe('plan seed data', () => {
  it('has 104 consecutive weeks, each in a main phase', () => {
    expect(weeksJson.weeks.map((w) => w.n)).toEqual(Array.from({ length: 104 }, (_, i) => i + 1));
    for (const w of weeksJson.weeks) {
      const phase = phasesJson.phases.find((p) => p.id === w.phase_id);
      expect(phase?.parallel).toBe(false);
      expect(w.n).toBeGreaterThanOrEqual(phase!.weeks![0]!);
      expect(w.n).toBeLessThanOrEqual(phase!.weeks![1]!);
    }
  });

  it('main phases cover weeks 1–104 without gaps or overlaps', () => {
    const main = phasesJson.phases.filter((p) => !p.parallel && p.weeks).sort((a, b) => a.weeks![0]! - b.weeks![0]!);
    let next = 1;
    for (const p of main) {
      expect(p.weeks![0]).toBe(next);
      next = p.weeks![1]! + 1;
    }
    expect(next).toBe(105);
  });

  it('milestones and projects reference existing phases, with due dates at the end of a week', () => {
    for (const m of milestonesJson.milestones) {
      expect(phaseIds.has(m.phase_id)).toBe(true);
      const ends = Array.from({ length: 104 }, (_, i) => weekRange(weeksJson.start_date, i + 1).end);
      expect(ends).toContain(m.due_date);
    }
    for (const p of projectsJson.projects) expect(phaseIds.has(p.phase_id)).toBe(true);
    expect(new Set(milestonesJson.milestones.map((m) => m.id)).size).toBe(milestonesJson.milestones.length);
  });

  it('never uses trademarked names in public project names', () => {
    for (const p of projectsJson.projects) expect(`${p.name_it} ${p.name_en}`).not.toMatch(/GTA/i);
  });

  it('maps the first-year weeks to 12 months of checks', () => {
    expect(PLAN_MONTHS).toHaveLength(12);
    expect(monthForWeek(1)?.month).toBe(1);
    expect(monthForWeek(27)?.month).toBe(7);
    expect(monthForWeek(52)?.month).toBe(12);
    expect(monthForWeek(53)).toBeUndefined();
    let next = 1;
    for (const m of PLAN_MONTHS) {
      expect(m.weeks[0]).toBe(next);
      next = m.weeks[1] + 1;
    }
    expect(next).toBe(53);
  });
});
