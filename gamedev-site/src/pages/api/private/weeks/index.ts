import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { getSettings, listWeeks, sessionMinutes } from '../../../../lib/server/db';
import { json, safe } from '../../../../lib/server/http';
import { toWeekViews } from '../../../../lib/overview';
import { currentWeek, todayInRome } from '../../../../lib/plan';

export const prerender = false;

export const GET: APIRoute = safe(async () => {
  const db = getDb();
  const [settings, weeks, sessions] = await Promise.all([getSettings(db), listWeeks(db), sessionMinutes(db)]);
  return json({
    currentWeek: currentWeek(settings.start_date, todayInRome()),
    weeklyTarget: settings.weekly_target_hours,
    weeks: toWeekViews(weeks, sessions, settings),
  });
});
