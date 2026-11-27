import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

/**
 * Verification of the Cloudflare Access JWT (header Cf-Access-Jwt-Assertion).
 * Checks signature (team JWKS), audience, issuer and expiry.
 */

export interface AccessConfig {
  teamDomain: string; // e.g. "myteam.cloudflareaccess.com"
  audience: string; // Application Audience (AUD) tag
}

export type AuthResult = { ok: true; email: string | null } | { ok: false; reason: string };

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function normalizeTeamDomain(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function getJwks(teamDomain: string) {
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, jwks);
  }
  return jwks;
}

export async function verifyAccessToken(
  token: string | null,
  config: AccessConfig,
  // Injectable for tests.
  keySet?: Parameters<typeof jwtVerify>[1],
): Promise<AuthResult> {
  if (!token) return { ok: false, reason: 'missing token' };
  const teamDomain = normalizeTeamDomain(config.teamDomain);
  if (!teamDomain || !config.audience) return { ok: false, reason: 'access not configured' };
  try {
    const { payload } = await jwtVerify(token, keySet ?? getJwks(teamDomain), {
      audience: config.audience,
      issuer: `https://${teamDomain}`,
      algorithms: ['RS256'],
      requiredClaims: ['exp'],
    });
    return { ok: true, email: emailOf(payload) };
  } catch {
    return { ok: false, reason: 'invalid token' };
  }
}

function emailOf(payload: JWTPayload): string | null {
  return typeof payload.email === 'string' ? payload.email : null;
}

/** Hosts considered local for the development bypass (localhost and private LAN addresses). */
export function isLocalHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost')) return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/**
 * The bypass is honoured only when all three are true:
 * running the dev server (compile-time flag, false in every production build),
 * DEV_BYPASS_AUTH=true in .dev.vars, and a local/LAN host.
 */
export function isDevBypassAllowed(opts: { isDev: boolean; flag: string | undefined; hostname: string }): boolean {
  return opts.isDev && opts.flag === 'true' && isLocalHost(opts.hostname);
}
