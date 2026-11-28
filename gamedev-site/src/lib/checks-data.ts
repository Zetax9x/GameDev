/** First-year monthly checks (public seed data, safe for the browser). */
import checksJson from '../../data/seed/verifiche.json';

export interface PlanMonth {
  month: number;
  weeks: [number, number];
  title: string;
  items: { id: string; text: string }[];
}

export const PLAN_MONTHS = checksJson.months as PlanMonth[];

/** First-year month containing week n, or undefined in year two / before the start. */
export function monthForWeek(n: number): PlanMonth | undefined {
  return PLAN_MONTHS.find((m) => n >= m.weeks[0] && n <= m.weeks[1]);
}
