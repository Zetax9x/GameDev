/** Small fetch wrapper for the private API. Errors come back as { error } with a status. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown, raw = false): Promise<T> {
  const init: RequestInit = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
  if (body !== undefined) {
    init.body = raw ? String(body) : JSON.stringify(body);
    init.headers = { ...init.headers, 'Content-Type': raw ? 'text/csv' : 'application/json' };
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError('Connessione assente: riprova quando sei online.', 0);
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError('Sessione scaduta o non autorizzata: ricarica la pagina per accedere di nuovo.', res.status);
  }
  // Access may answer with its HTML login page instead of JSON.
  const type = res.headers.get('Content-Type') ?? '';
  if (!type.includes('application/json')) {
    throw new ApiError('Risposta inattesa dal server: ricarica la pagina.', res.status);
  }
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? `Errore ${res.status}`, res.status);
  return data;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body: unknown) => request<T>('POST', url, body),
  postCsv: <T>(url: string, csv: string) => request<T>('POST', url, csv, true),
  patch: <T>(url: string, body: unknown) => request<T>('PATCH', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
};

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Errore sconosciuto';
}
