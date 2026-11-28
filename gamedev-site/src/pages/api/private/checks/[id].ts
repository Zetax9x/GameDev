import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/server/env';
import { updateCheck } from '../../../../lib/server/db';
import { error, json, readJson, safe } from '../../../../lib/server/http';
import { checkIdParam, checkPatch } from '../../../../lib/validation';
import { toCheckView } from '../../../../lib/overview';
import { todayInRome } from '../../../../lib/plan';

export const prerender = false;

export const PATCH: APIRoute = safe(async ({ params, request }) => {
  const id = checkIdParam.safeParse(params.id);
  if (!id.success) return error(400, 'Id non valido');
  const patch = await readJson(request, checkPatch);
  if (patch instanceof Response) return patch;
  const row = await updateCheck(getDb(), id.data, patch.done, todayInRome());
  return row ? json({ check: toCheckView(row) }) : error(404, 'Verifica non trovata');
});
