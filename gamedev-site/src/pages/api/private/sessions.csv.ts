import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/env';
import { listSessions } from '../../../lib/server/db';
import { PRIVATE_HEADERS, safe } from '../../../lib/server/http';
import { toCsv } from '../../../lib/csv';
import { todayInRome } from '../../../lib/plan';

export const prerender = false;

export const GET: APIRoute = safe(async () => {
  const sessions = await listSessions(getDb());
  const csv = toCsv(
    ['data', 'minuti', 'categoria', 'nota', 'link'],
    [...sessions].reverse().map((s) => [s.date, s.minutes, s.category, s.note, s.link]),
  );
  return new Response(csv, {
    headers: {
      ...PRIVATE_HEADERS,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sessioni-${todayInRome()}.csv"`,
    },
  });
});
