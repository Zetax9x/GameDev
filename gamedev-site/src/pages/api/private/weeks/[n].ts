import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { getSettings, sessionMinutes, updateWeek } from '../../../../lib/server/db';
import { error, json, readJson, safe } from '../../../../lib/server/http';
import { weekParam, weekPatch } from '../../../../lib/validation';
import { toWeekViews } from '../../../../lib/overview';

export const prerender = false;

export const PATCH: APIRoute = safe(async ({ params, request }) => {
  const n = weekParam.safeParse(params.n);
  if (!n.success) return error(400, 'Numero di settimana non valido');
  const patch = await readJson(request, weekPatch);
  if (patch instanceof Response) return patch;
  const db = getDb();
  const row = await updateWeek(db, n.data, patch);
  if (!row) return error(404, 'Settimana non trovata');
  const [settings, sessions] = await Promise.all([getSettings(db), sessionMinutes(db)]);
  return json({ week: toWeekViews([row], sessions, settings)[0] });
});
