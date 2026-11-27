import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { updateMilestone } from '../../../../lib/server/db';
import { error, json, readJson, safe } from '../../../../lib/server/http';
import { milestoneIdParam, milestonePatch } from '../../../../lib/validation';
import { toMilestoneView } from '../../../../lib/overview';
import { todayInRome } from '../../../../lib/plan';

export const prerender = false;

export const PATCH: APIRoute = safe(async ({ params, request }) => {
  const id = milestoneIdParam.safeParse(params.id);
  if (!id.success) return error(400, 'Id non valido');
  const patch = await readJson(request, milestonePatch);
  if (patch instanceof Response) return patch;
  // Marking as reached without a date: use today.
  if (patch.status === 'raggiunto' && patch.reached_date === undefined) patch.reached_date = todayInRome();
  const row = await updateMilestone(getDb(), id.data, patch);
  if (!row) return error(404, 'Traguardo non trovato');
  return json({ milestone: toMilestoneView(row, todayInRome()) });
});
