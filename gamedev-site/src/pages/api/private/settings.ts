import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/env';
import { getSettings, updateSettings } from '../../../lib/server/db';
import { json, readJson, safe } from '../../../lib/server/http';
import { settingsPatch } from '../../../lib/validation';

export const prerender = false;

export const GET: APIRoute = safe(async () => json({ settings: await getSettings(getDb()) }));

export const PATCH: APIRoute = safe(async ({ request }) => {
  const patch = await readJson(request, settingsPatch);
  if (patch instanceof Response) return patch;
  const db = getDb();
  await updateSettings(db, patch);
  return json({ settings: await getSettings(db) });
});
