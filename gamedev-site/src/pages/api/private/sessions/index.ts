import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { getSettings, insertSession, listSessions, recentSessions, sessionMinutes } from '../../../../lib/server/db';
import { error, json, readJson, safe } from '../../../../lib/server/http';
import { rangeQuery, sessionInput } from '../../../../lib/validation';
import { currentWeek, hoursForWeek, round1, todayInRome, weekOfDate, weekRange } from '../../../../lib/plan';

export const prerender = false;

/** GET /api/private/sessions?from=&to= (or ?recent=5 for the latest sessions). */
export const GET: APIRoute = safe(async ({ url }) => {
  const db = getDb();
  const recent = url.searchParams.get('recent');
  if (recent !== null) {
    const limit = Math.min(Math.max(Number(recent) || 5, 1), 50);
    return json({ sessions: await recentSessions(db, limit) });
  }
  const parsed = rangeQuery.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  if (!parsed.success) return error(400, 'Parametri from/to non validi (YYYY-MM-DD)');
  return json({ sessions: await listSessions(db, parsed.data.from, parsed.data.to) });
});

/** POST /api/private/sessions: creates a session, returns it with the updated hours of its week. */
export const POST: APIRoute = safe(async ({ request }) => {
  const input = await readJson(request, sessionInput);
  if (input instanceof Response) return input;
  const db = getDb();
  const session = await insertSession(db, input);
  const [settings, all] = await Promise.all([getSettings(db), sessionMinutes(db)]);
  const n = weekOfDate(settings.start_date, session.date) ?? currentWeek(settings.start_date, todayInRome());
  const weekHours = n > 0 ? round1(hoursForWeek(all, weekRange(settings.start_date, n))) : 0;
  return json({ session, week: n, weekHours, weeklyTarget: settings.weekly_target_hours }, { status: 201 });
});
