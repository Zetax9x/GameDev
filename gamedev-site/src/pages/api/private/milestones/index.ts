import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { listMilestones } from '../../../../lib/server/db';
import { json, safe } from '../../../../lib/server/http';
import { toMilestoneView } from '../../../../lib/overview';
import { todayInRome } from '../../../../lib/plan';

export const prerender = false;

export const GET: APIRoute = safe(async () => {
  const today = todayInRome();
  const rows = await listMilestones(getDb());
  return json({ milestones: rows.map((m) => toMilestoneView(m, today)) });
});
