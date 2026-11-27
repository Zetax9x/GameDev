import {
  averageHoursOfActiveWeeks,
  currentWeek,
  dayStreak,
  isPlanCompleted,
  minutesByWeek,
  round1,
  totalHours,
  weekRange,
  TOTAL_WEEKS,
} from './plan';
import type { MilestoneFullRow, MilestoneView, Overview, SessionRow, Settings, WeekRow, WeekView } from './types';

export function toWeekViews(weeks: readonly WeekRow[], sessions: readonly Pick<SessionRow, 'date' | 'minutes'>[], settings: Settings): WeekView[] {
  const byWeek = minutesByWeek(settings.start_date, sessions);
  return weeks.map((w) => {
    const range = weekRange(settings.start_date, w.n);
    return { ...w, start: range.start, end: range.end, hours: round1((byWeek.get(w.n) ?? 0) / 60) };
  });
}

export function toMilestoneView(m: MilestoneFullRow, today: string): MilestoneView {
  return {
    ...m,
    is_public: m.is_public === 1,
    suggest_late: m.status !== 'raggiunto' && m.status !== 'in_ritardo' && m.due_date < today,
  };
}

export function buildOverview(input: {
  today: string;
  settings: Settings;
  weeks: readonly WeekRow[];
  sessions: readonly Pick<SessionRow, 'date' | 'minutes'>[];
  milestones: readonly MilestoneFullRow[];
}): Overview {
  const { today, settings } = input;
  const views = toWeekViews(input.weeks, input.sessions, settings);
  const n = currentWeek(settings.start_date, today);
  const completed = isPlanCompleted(settings.start_date, today);
  const planState = n === 0 ? 'not_started' : completed ? 'completed' : 'running';
  const current = n > 0 ? (views.find((w) => w.n === n) ?? null) : null;

  // Last 12 weeks up to the current one (the first 12 before the start).
  const last = Math.max(n, 12);
  const first = Math.max(1, last - 11);
  const chart: { n: number; hours: number }[] = [];
  for (let i = first; i <= Math.min(last, TOTAL_WEEKS); i++) {
    chart.push({ n: i, hours: views.find((w) => w.n === i)?.hours ?? 0 });
  }

  const nextMilestones = [...input.milestones]
    .filter((m) => m.status !== 'raggiunto')
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.sort_order - b.sort_order)
    .slice(0, 3)
    .map((m) => toMilestoneView(m, today));

  return {
    today,
    settings,
    planState,
    currentWeek: current,
    weekHours: current?.hours ?? 0,
    totals: {
      hours: round1(totalHours(input.sessions)),
      weeksDone: input.weeks.filter((w) => w.status === 'fatta').length,
      averageHours: round1(averageHoursOfActiveWeeks(views.map((w) => w.hours))),
      streakDays: dayStreak(
        input.sessions.map((s) => s.date),
        today,
      ),
    },
    chart,
    nextMilestones,
  };
}
