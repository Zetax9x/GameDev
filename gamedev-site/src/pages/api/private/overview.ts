import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/env';
import { getJournal, getSettings, listChecks, listMilestones, listWeeks, sessionMinutes } from '../../../lib/server/db';
import { json, safe } from '../../../lib/server/http';
import { buildOverview } from '../../../lib/overview';
import { todayInRome } from '../../../lib/plan';

export const prerender = false;

export const GET: APIRoute = safe(async () => {
  const db = getDb();
  const today = todayInRome();
  const [settings, weeks, sessions, milestones, checks, journal] = await Promise.all([
    getSettings(db),
    listWeeks(db),
    sessionMinutes(db),
    listMilestones(db),
    listChecks(db),
    getJournal(db, today),
  ]);
  return json(buildOverview({ today, settings, weeks, sessions, milestones, checks, journalToday: journal !== null }));
});
