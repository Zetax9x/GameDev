import { defineMiddleware } from 'astro:middleware';
import { isDevBypassAllowed, verifyAccessToken } from './lib/server/auth';
import { error } from './lib/server/http';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

function withSecurityHeaders(response: Response): Response {
  // Some responses (e.g. redirects) have immutable headers: copy them first.
  const res = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!res.headers.has(k)) res.headers.set(k, v);
  return res;
}

/**
 * Second line of defence behind Cloudflare Access: every request to /api/private/*
 * must carry a valid Access JWT (signature, aud, iss, exp), otherwise 401.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Prerendered pages run through middleware only at build time: nothing to protect there.
  if (context.isPrerendered) return next();

  const { pathname, hostname } = context.url;
  if (pathname.startsWith('/api/private/') || pathname === '/api/private') {
    const { env } = await import('cloudflare:workers');
    const vars = env as Env & { DEV_BYPASS_AUTH?: string };
    const bypass = isDevBypassAllowed({ isDev: import.meta.env.DEV, flag: vars.DEV_BYPASS_AUTH, hostname });
    if (!bypass) {
      const result = await verifyAccessToken(context.request.headers.get('Cf-Access-Jwt-Assertion'), {
        teamDomain: vars.ACCESS_TEAM_DOMAIN ?? '',
        audience: vars.ACCESS_AUD ?? '',
      });
      if (!result.ok) return withSecurityHeaders(error(401, 'Non autorizzato'));
    }
    // Private endpoints must never be cross-origin writable: reject foreign Origins on writes.
    const method = context.request.method;
    if (method !== 'GET' && method !== 'HEAD') {
      const origin = context.request.headers.get('Origin');
      if (origin && origin !== context.url.origin) return withSecurityHeaders(error(403, 'Origine non consentita'));
    }
  }
  return withSecurityHeaders(await next());
});
