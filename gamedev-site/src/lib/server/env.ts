import { env } from 'cloudflare:workers';

/** The D1 binding. Only import this module from on-demand routes. */
export function getDb(): D1Database {
  return (env as Env).DB;
}
