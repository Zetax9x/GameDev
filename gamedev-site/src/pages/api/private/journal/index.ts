import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { listJournal } from '../../../../lib/server/db';
import { error, json, safe } from '../../../../lib/server/http';
import { rangeQuery } from '../../../../lib/validation';

export const prerender = false;

/** GET /api/private/journal?from=&to=&limit= — newest first. */
export const GET: APIRoute = safe(async ({ url }) => {
  const parsed = rangeQuery.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  if (!parsed.success) return error(400, 'Parametri from/to non validi (YYYY-MM-DD)');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 60, 1), 400);
  return json({ entries: await listJournal(getDb(), parsed.data.from, parsed.data.to, limit) });
});
