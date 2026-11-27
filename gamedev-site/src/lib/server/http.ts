import type { z } from 'zod';

export const PRIVATE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(status: number, message: string): Response {
  return json({ error: message }, { status });
}

/** Reads and validates a JSON body. Returns the data or a 400 Response. */
export async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S> | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Corpo della richiesta non valido (JSON atteso)');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return error(400, issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'Input non valido');
  }
  return parsed.data;
}

/** Wraps a handler so unexpected errors become a generic 500 without leaking details. */
export function safe<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error(e);
      return error(500, 'Errore interno');
    }
  };
}
