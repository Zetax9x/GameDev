import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { insertSessions } from '../../../../lib/server/db';
import { error, json, safe } from '../../../../lib/server/http';
import { parseSessionsCsv } from '../../../../lib/csv';

export const prerender = false;

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 5_000;

/**
 * POST /api/private/import/sessions[?dryRun=true]
 * Body: the CSV text. With dryRun it only returns the preview; otherwise it saves
 * the valid rows (all in one transaction) and reports the skipped ones.
 */
export const POST: APIRoute = safe(async ({ request, url }) => {
  const text = await request.text();
  if (text.length > MAX_BYTES) return error(413, 'File troppo grande (max 1 MB)');
  const { rows, error: parseError } = parseSessionsCsv(text);
  if (parseError) return error(400, parseError);
  if (rows.length > MAX_ROWS) return error(413, `Troppe righe (max ${MAX_ROWS})`);

  const valid = rows.flatMap((r) => (r.ok && r.value ? [r.value] : []));
  const invalid = rows.filter((r) => !r.ok).map((r) => ({ line: r.line, error: r.error }));
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const imported = dryRun ? 0 : await insertSessions(getDb(), valid);
  return json({
    dryRun,
    total: rows.length,
    valid: valid.length,
    imported,
    invalid,
    preview: valid.slice(0, 20),
    totalMinutes: valid.reduce((s, r) => s + r.minutes, 0),
  });
});
