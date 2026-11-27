# Pubblicazione (Milestone 5) — passi per Yuri

Questi passi toccano il tuo account Cloudflare: li fai tu dal portatile, uno alla volta.
Tutti i comandi vanno lanciati nella cartella `gamedev-site/`.

## 0. Prima volta sul portatile

```bash
git clone <url-del-repo> && cd GameDev/gamedev-site
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev            # http://localhost:4321/en/ e http://localhost:4321/dashboard/
```

Per provare la dashboard dal telefono (stessa rete Wi-Fi): `npm run dev:lan` e apri `http://IP-DEL-PORTATILE:4321/dashboard/`.

## 1. Login a Cloudflare

```bash
npx wrangler login
```

## 2. Database remoto

```bash
npx wrangler d1 create yuri-gamedev-db
```

Copia il `database_id` che stampa e mettilo in `wrangler.jsonc` al posto di `00000000-…`. Poi:

```bash
npm run db:migrate:remote
```

## 3. Primo deploy

```bash
npm run deploy
```

Il sito sarà su `https://yuri-gamedev.<tuo-account>.workers.dev`.
Aggiorna l'indirizzo in `astro.config.mjs` (`SITE`) così canonical, sitemap e RSS puntano all'URL giusto.

## 4. Login dell'area privata (Cloudflare Access)

Segui `LEGGIMI.md`, passo 7. Percorsi da proteggere: `/dashboard*` e `/api/private/*`.
Poi metti in `wrangler.jsonc`, sezione `vars`:

- `ACCESS_TEAM_DOMAIN`: `tuoteam.cloudflareaccess.com`
- `ACCESS_AUD`: l'Application Audience (AUD) Tag

e rifai `npm run deploy`. Finché queste due variabili sono vuote, le API private rispondono sempre 401 (fail-closed).

Controlli finali:

- `/dashboard/` chiede il codice via email
- `/api/private/overview` senza login → pagina di login di Access (o 401)
- le pagine pubbliche si vedono senza login

## 5. URL di anteprima

Sono già disattivati in `wrangler.jsonc` (`"preview_urls": false`). Controlla nel pannello
(Workers → yuri-gamedev → Settings → Domains & Routes) che risultino spenti.

## 6. Deploy automatico (Workers Builds)

Pannello Cloudflare → Workers → yuri-gamedev → Settings → Builds → collega il repository GitHub (privato).

- Root directory: `gamedev-site`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Branch: `main`
