import { describe, expect, it } from 'vitest';
import {
  addDays,
  averageHoursOfActiveWeeks,
  currentWeek,
  dayStreak,
  hoursForWeek,
  isIsoDate,
  isPlanCompleted,
  minutesByWeek,
  phaseForWeek,
  parallelPhasesForWeek,
  phaseTimeState,
  planDay,
  todayInRome,
  weekOfDate,
  weekRange,
} from '../src/lib/plan';
import phasesJson from '../data/seed/fasi.json';

const START = '2026-11-30';
const phases = phasesJson.phases;

describe('dates', () => {
  it('validates ISO dates', () => {
    expect(isIsoDate('2026-11-30')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('30/11/2026')).toBe(false);
  });

  it('adds days across months, years and DST', () => {
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2027-03-27', 2)).toBe('2027-03-29'); // DST change in Europe
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
  });

  it('computes today in Europe/Rome', () => {
    // 23:30 UTC on 30 Nov is already 1 Dec in Rome (UTC+1).
    expect(todayInRome(new Date('2026-11-30T23:30:00Z'))).toBe('2026-12-01');
    expect(todayInRome(new Date('2026-11-30T12:00:00Z'))).toBe('2026-11-30');
  });
});

describe('weekRange', () => {
  it('matches the reference dates of the seed', () => {
    expect(weekRange(START, 1)).toEqual({ n: 1, start: '2026-11-30', end: '2026-12-06' });
    expect(weekRange(START, 5)).toEqual({ n: 5, start: '2026-12-28', end: '2027-01-03' });
    expect(weekRange(START, 104).end).toBe('2028-11-26');
  });

  it('shifts when the start date changes', () => {
    expect(weekRange('2027-01-04', 1).start).toBe('2027-01-04');
  });

  it('rejects out of range weeks', () => {
    expect(() => weekRange(START, 0)).toThrow();
    expect(() => weekRange(START, 105)).toThrow();
  });
});

describe('currentWeek', () => {
  it('is 0 before the start', () => {
    expect(currentWeek(START, '2026-11-29')).toBe(0);
  });
  it('is 1 during the first week', () => {
    expect(currentWeek(START, '2026-11-30')).toBe(1);
    expect(currentWeek(START, '2026-12-06')).toBe(1);
  });
  it('moves on each Monday', () => {
    expect(currentWeek(START, '2026-12-07')).toBe(2);
    expect(currentWeek(START, '2027-02-15')).toBe(12);
  });
  it('is capped at 104 and flags completion', () => {
    expect(currentWeek(START, '2028-11-26')).toBe(104);
    expect(isPlanCompleted(START, '2028-11-26')).toBe(false);
    expect(currentWeek(START, '2030-01-01')).toBe(104);
    expect(isPlanCompleted(START, '2028-11-27')).toBe(true);
  });
  it('maps a date to its week', () => {
    expect(weekOfDate(START, '2026-11-29')).toBeNull();
    expect(weekOfDate(START, '2026-12-13')).toBe(2);
    expect(weekOfDate(START, '2028-11-27')).toBeNull();
  });
});

describe('hours', () => {
  const sessions = [
    { date: '2026-11-30', minutes: 90 },
    { date: '2026-12-06', minutes: 30 },
    { date: '2026-12-07', minutes: 60 },
    { date: '2026-11-29', minutes: 999 },
  ];

  it('sums only sessions inside the week', () => {
    expect(hoursForWeek(sessions, weekRange(START, 1))).toBe(2);
    expect(hoursForWeek(sessions, weekRange(START, 2))).toBe(1);
    expect(hoursForWeek(sessions, weekRange(START, 3))).toBe(0);
  });

  it('groups minutes by week, ignoring dates outside the plan', () => {
    const map = minutesByWeek(START, sessions);
    expect(map.get(1)).toBe(120);
    expect(map.get(2)).toBe(60);
    expect(map.size).toBe(2);
  });

  it('averages only weeks with hours', () => {
    expect(averageHoursOfActiveWeeks([0, 10, 0, 20])).toBe(15);
    expect(averageHoursOfActiveWeeks([0, 0])).toBe(0);
    expect(averageHoursOfActiveWeeks([])).toBe(0);
  });
});

describe('dayStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(dayStreak(['2026-12-01', '2026-12-02', '2026-12-03'], '2026-12-03')).toBe(3);
  });
  it('still counts when today has no session yet', () => {
    expect(dayStreak(['2026-12-01', '2026-12-02'], '2026-12-03')).toBe(2);
  });
  it('breaks on a gap', () => {
    expect(dayStreak(['2026-11-29', '2026-12-01', '2026-12-02'], '2026-12-02')).toBe(2);
    expect(dayStreak(['2026-12-01'], '2026-12-03')).toBe(0);
  });
  it('handles duplicates and month boundaries', () => {
    expect(dayStreak(['2026-11-30', '2026-12-01', '2026-12-01'], '2026-12-01')).toBe(2);
  });
});

describe('phases', () => {
  it('finds the main phase of a week', () => {
    expect(phaseForWeek(phases, 0)?.id).toBe('f1');
    expect(phaseForWeek(phases, 9)?.id).toBe('f1');
    expect(phaseForWeek(phases, 10)?.id).toBe('f3');
    expect(phaseForWeek(phases, 27)?.id).toBe('f5');
    expect(phaseForWeek(phases, 53)?.id).toBe('f8');
    expect(phaseForWeek(phases, 104)?.id).toBe('f10');
  });
  it('finds parallel phases', () => {
    expect(parallelPhasesForWeek(phases, 10).map((p) => p.id)).toEqual(['f2']);
    expect(parallelPhasesForWeek(phases, 40)).toEqual([]);
  });
  it('classifies phases in time', () => {
    const f5 = phases.find((p) => p.id === 'f5')!;
    expect(phaseTimeState(f5, 10)).toBe('future');
    expect(phaseTimeState(f5, 30)).toBe('current');
    expect(phaseTimeState(f5, 50)).toBe('past');
    expect(phaseTimeState(phases.find((p) => p.id === 'f11')!, 104)).toBe('future');
  });
});

describe('planDay', () => {
  it('maps a date to day 1–7 of its plan week', () => {
    expect(planDay(START, '2026-11-30')).toBe(1);
    expect(planDay(START, '2026-12-06')).toBe(7);
    expect(planDay(START, '2026-12-07')).toBe(1);
  });
  it('is null outside the plan', () => {
    expect(planDay(START, '2026-11-29')).toBeNull();
    expect(planDay(START, '2028-11-27')).toBeNull();
  });
});
