import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { deleteJournal, getJournal, upsertJournal } from '../../../../lib/server/db';
import { error, json, readJson, safe } from '../../../../lib/server/http';
import { isoDate, journalInput } from '../../../../lib/validation';

export const prerender = false;

export const GET: APIRoute = safe(async ({ params }) => {
  const date = isoDate.safeParse(params.date);
  if (!date.success) return error(400, 'Data non valida');
  return json({ entry: await getJournal(getDb(), date.data) });
});

/** PUT /api/private/journal/YYYY-MM-DD — creates or replaces the entry of that day. */
export const PUT: APIRoute = safe(async ({ params, request }) => {
  const date = isoDate.safeParse(params.date);
  if (!date.success) return error(400, 'Data non valida');
  const input = await readJson(request, journalInput);
  if (input instanceof Response) return input;
  return json({ entry: await upsertJournal(getDb(), date.data, input) });
});

export const DELETE: APIRoute = safe(async ({ params }) => {
  const date = isoDate.safeParse(params.date);
  if (!date.success) return error(400, 'Data non valida');
  return (await deleteJournal(getDb(), date.data)) ? json({ ok: true }) : error(404, 'Voce non trovata');
});
