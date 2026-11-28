import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { getSettings, listChecks } from '../../../../lib/server/db';
import { json, safe } from '../../../../lib/server/http';
import { toCheckView } from '../../../../lib/overview';
import { currentWeek, todayInRome } from '../../../../lib/plan';

export const prerender = false;

export const GET: APIRoute = safe(async () => {
  const db = getDb();
  const [settings, checks] = await Promise.all([getSettings(db), listChecks(db)]);
  return json({ currentWeek: currentWeek(settings.start_date, todayInRome()), checks: checks.map(toCheckView) });
});
