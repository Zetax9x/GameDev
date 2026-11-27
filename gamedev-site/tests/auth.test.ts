import { describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { isDevBypassAllowed, isLocalHost, verifyAccessToken } from '../src/lib/server/auth';

const config = { teamDomain: 'team.cloudflareaccess.com', audience: 'aud-123' };

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
  const keySet = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: { aud?: string; iss?: string; exp?: number | string }) => {
    let jwt = new SignJWT({ email: 'someone@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuedAt()
      .setAudience(claims.aud ?? config.audience)
      .setIssuer(claims.iss ?? `https://${config.teamDomain}`);
    jwt = jwt.setExpirationTime(claims.exp ?? '1h');
    return jwt.sign(privateKey);
  };
  return { keySet, sign };
}

describe('verifyAccessToken', () => {
  it('accepts a valid token', async () => {
    const { keySet, sign } = await setup();
    const res = await verifyAccessToken(await sign({}), config, keySet);
    expect(res).toEqual({ ok: true, email: 'someone@example.com' });
  });

  it('rejects missing, wrong audience, wrong issuer and expired tokens', async () => {
    const { keySet, sign } = await setup();
    expect((await verifyAccessToken(null, config, keySet)).ok).toBe(false);
    expect((await verifyAccessToken(await sign({ aud: 'other' }), config, keySet)).ok).toBe(false);
    expect((await verifyAccessToken(await sign({ iss: 'https://evil.example' }), config, keySet)).ok).toBe(false);
    const past = Math.floor(Date.now() / 1000) - 60;
    expect((await verifyAccessToken(await sign({ exp: past }), config, keySet)).ok).toBe(false);
    expect((await verifyAccessToken('not.a.jwt', config, keySet)).ok).toBe(false);
  });

  it('rejects tokens signed by another key', async () => {
    const a = await setup();
    const b = await setup();
    expect((await verifyAccessToken(await b.sign({}), config, a.keySet)).ok).toBe(false);
  });

  it('fails closed when Access is not configured', async () => {
    const { keySet, sign } = await setup();
    const res = await verifyAccessToken(await sign({}), { teamDomain: '', audience: '' }, keySet);
    expect(res.ok).toBe(false);
  });
});

describe('dev bypass', () => {
  it('recognises local hosts', () => {
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('127.0.0.1')).toBe(true);
    expect(isLocalHost('192.168.1.20')).toBe(true);
    expect(isLocalHost('yuri-gamedev.example.workers.dev')).toBe(false);
    expect(isLocalHost('8.8.8.8')).toBe(false);
  });

  it('requires dev mode, the flag and a local host', () => {
    expect(isDevBypassAllowed({ isDev: true, flag: 'true', hostname: 'localhost' })).toBe(true);
    expect(isDevBypassAllowed({ isDev: false, flag: 'true', hostname: 'localhost' })).toBe(false);
    expect(isDevBypassAllowed({ isDev: true, flag: undefined, hostname: 'localhost' })).toBe(false);
    expect(isDevBypassAllowed({ isDev: true, flag: 'true', hostname: 'x.workers.dev' })).toBe(false);
  });
});
