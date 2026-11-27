import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/env';
import { getSettings, listMilestones, listWeeks, sessionMinutes } from '../../../lib/server/db';
import { json, safe } from '../../../lib/server/http';
import { buildOverview } from '../../../lib/overview';
import { todayInRome } from '../../../lib/plan';

export const prerender = false;

export const GET: APIRoute = safe(async () => {
  const db = getDb();
  const [settings, weeks, sessions, milestones] = await Promise.all([
    getSettings(db),
    listWeeks(db),
    sessionMinutes(db),
    listMilestones(db),
  ]);
  return json(buildOverview({ today: todayInRome(), settings, weeks, sessions, milestones }));
});
