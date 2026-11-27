import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { deleteSession } from '../../../../lib/server/db';
import { error, json, safe } from '../../../../lib/server/http';
import { idParam } from '../../../../lib/validation';

export const prerender = false;

export const DELETE: APIRoute = safe(async ({ params }) => {
  const id = idParam.safeParse(params.id);
  if (!id.success) return error(400, 'Id non valido');
  const deleted = await deleteSession(getDb(), id.data);
  return deleted ? json({ ok: true }) : error(404, 'Sessione non trovata');
});
