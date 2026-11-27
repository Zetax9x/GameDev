import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/env';
import { getSettings, listMilestones, totalMinutes } from '../../../lib/server/db';
import { buildPublicProgress } from '../../../lib/progress';
import { todayInRome } from '../../../lib/plan';
import { PHASES } from '../../../lib/content-data';

export const prerender = false;

/** The only public endpoint: aggregated progress, whitelisted fields only (docs/SPEC.md §9). */
export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const [settings, milestones] = await Promise.all([getSettings(db), listMilestones(db)]);
    const minutes = settings.public_show_hours ? await totalMinutes(db) : 0;
    const body = buildPublicProgress({
      startDate: settings.start_date,
      today: todayInRome(),
      phases: PHASES,
      milestones,
      showHours: settings.public_show_hours,
      totalMinutes: minutes,
    });
    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Non disponibile' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
};
