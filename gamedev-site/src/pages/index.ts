import type { APIRoute } from 'astro';

// Rendered on demand: redirects "/" to the browser language (Italian -> /it/, anything else -> /en/).
export const prerender = false;

export function preferredLang(acceptLanguage: string | null): 'it' | 'en' {
  if (!acceptLanguage) return 'en';
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q);
  const first = ranked.find((x) => x.tag.startsWith('it') || x.tag.startsWith('en') || x.tag === '*');
  return first?.tag.startsWith('it') ? 'it' : 'en';
}

export const GET: APIRoute = ({ request }) => {
  const lang = preferredLang(request.headers.get('Accept-Language'));
  return new Response(null, {
    status: 302,
    headers: { Location: `/${lang}/`, Vary: 'Accept-Language', 'Cache-Control': 'private, max-age=0' },
  });
};
