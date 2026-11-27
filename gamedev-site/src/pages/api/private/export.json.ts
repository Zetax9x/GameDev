import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/env';
import { getSettings, listMilestones, listSessions, listWeeks } from '../../../lib/server/db';
import { json, safe } from '../../../lib/server/http';
import { todayInRome } from '../../../lib/plan';

export const prerender = false;

/** Full backup of the private data. */
export const GET: APIRoute = safe(async () => {
  const db = getDb();
  const [settings, weeks, sessions, milestones] = await Promise.all([
    getSettings(db),
    listWeeks(db),
    listSessions(db),
    listMilestones(db),
  ]);
  const today = todayInRome();
  return json(
    { exported_at: new Date().toISOString(), version: 1, settings, weeks, sessions, milestones },
    { headers: { 'Content-Disposition': `attachment; filename="gamedev-backup-${today}.json"` } },
  );
});
