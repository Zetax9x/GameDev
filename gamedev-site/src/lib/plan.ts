/**
 * Pure date and statistics logic for the 104-week plan.
 * All dates are ISO strings (YYYY-MM-DD); arithmetic is done in UTC on
 * calendar dates so DST changes never shift a day.
 */

export const TOTAL_WEEKS = 104;
export const TIME_ZONE = 'Europe/Rome';

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtcMs(iso: string): number {
  if (!isIsoDate(iso)) throw new Error(`Invalid ISO date: ${iso}`);
  return Date.parse(`${iso}T00:00:00Z`);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUtcMs(toUtcMs(iso) + days * DAY_MS);
}

/** Whole days from `a` to `b` (positive when b is after a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

/** Today's calendar date in Europe/Rome. */
export function todayInRome(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export interface WeekRange {
  n: number;
  start: string;
  end: string;
}

/** Start = start_date + 7 × (n − 1), end = start + 6 days. */
export function weekRange(startDate: string, n: number): WeekRange {
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_WEEKS) {
    throw new Error(`Week out of range: ${n}`);
  }
  const start = addDays(startDate, 7 * (n - 1));
  return { n, start, end: addDays(start, 6) };
}

/**
 * Current week = floor((today − start_date) / 7) + 1.
 * Returns 0 before the start and is capped at 104 after the end.
 */
export function currentWeek(startDate: string, today: string): number {
  const diff = daysBetween(startDate, today);
  if (diff < 0) return 0;
  return Math.min(Math.floor(diff / 7) + 1, TOTAL_WEEKS);
}

/** True when the whole plan is over (today is after the end of week 104). */
export function isPlanCompleted(startDate: string, today: string): boolean {
  return today > weekRange(startDate, TOTAL_WEEKS).end;
}

/** Week number a given date belongs to, or null if outside the plan. */
export function weekOfDate(startDate: string, date: string): number | null {
  const diff = daysBetween(startDate, date);
  if (diff < 0) return null;
  const n = Math.floor(diff / 7) + 1;
  return n > TOTAL_WEEKS ? null : n;
}

export interface SessionLike {
  date: string;
  minutes: number;
}

/** Hours of a week: sum of minutes of sessions within [start, end], / 60. */
export function hoursForWeek(sessions: readonly SessionLike[], range: WeekRange): number {
  let minutes = 0;
  for (const s of sessions) {
    if (s.date >= range.start && s.date <= range.end) minutes += s.minutes;
  }
  return minutes / 60;
}

/** Minutes per week number (1..104) for all sessions, in one pass. */
export function minutesByWeek(startDate: string, sessions: readonly SessionLike[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const s of sessions) {
    const n = weekOfDate(startDate, s.date);
    if (n === null) continue;
    out.set(n, (out.get(n) ?? 0) + s.minutes);
  }
  return out;
}

export function totalHours(sessions: readonly SessionLike[]): number {
  return sessions.reduce((sum, s) => sum + s.minutes, 0) / 60;
}

/** Average hours across weeks that have more than 0 hours. 0 when none. */
export function averageHoursOfActiveWeeks(hoursPerWeek: readonly number[]): number {
  const active = hoursPerWeek.filter((h) => h > 0);
  if (active.length === 0) return 0;
  return active.reduce((a, b) => a + b, 0) / active.length;
}

/**
 * Streak of consecutive days with at least one session, ending today.
 * If there is no session today yet, the streak ending yesterday still counts
 * (the day is not over).
 */
export function dayStreak(sessionDates: readonly string[], today: string): number {
  const days = new Set(sessionDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Round to one decimal, for display and the public API. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export interface PhaseLike {
  id: string;
  weeks: readonly [number, number] | readonly number[] | null;
  parallel: boolean;
}

/**
 * Main (non-parallel) phase that contains week n.
 * Week 0 maps to the first phase; anything past the last range maps to the last one with weeks.
 */
export function phaseForWeek<P extends PhaseLike>(phases: readonly P[], n: number): P | undefined {
  const main = phases.filter((p) => !p.parallel && p.weeks);
  const week = Math.max(1, n);
  const hit = main.find((p) => p.weeks && week >= (p.weeks[0] ?? 0) && week <= (p.weeks[1] ?? 0));
  return hit ?? (week > TOTAL_WEEKS ? main.at(-1) : main[0]);
}

/** Parallel phases active in week n. */
export function parallelPhasesForWeek<P extends PhaseLike>(phases: readonly P[], n: number): P[] {
  return phases.filter(
    (p) => p.parallel && p.weeks && n >= (p.weeks[0] ?? 0) && n <= (p.weeks[1] ?? 0),
  );
}

export type PhaseTimeState = 'past' | 'current' | 'future';

export function phaseTimeState(phase: PhaseLike, n: number): PhaseTimeState {
  if (!phase.weeks) return 'future';
  const [from = 0, to = 0] = phase.weeks;
  if (n > to) return 'past';
  if (n >= from) return 'current';
  return 'future';
}
