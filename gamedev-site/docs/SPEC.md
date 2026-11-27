# SPEC — Sito "Game Dev Journey"

Versione 1.0 · 27 novembre 2026

## 1. Obiettivo

Un sito che fa due cose:

1. **Pubblico (IT/EN):** racconta il percorso di Yuri da principiante a programmatore C++ di videogiochi. Devlog, progetti, percorso a fasi, pagina personale. Nel 2028 deve funzionare da portfolio per candidarsi negli studi di videogiochi.
2. **Privato (solo Yuri, solo IT):** dashboard per registrare le sessioni di studio anche dal telefono durante i turni, seguire le 104 settimane del piano e aggiornare i traguardi.

Vincoli: hosting gratuito, nessun dominio per ora (indirizzo `*.workers.dev`), manutenzione semplice per una persona.

## 2. Chi lo usa

| Utente | Cosa cerca | Dispositivo |
| --- | --- | --- |
| Recruiter, programmatori, community | Progetti, codice, crescita nel tempo | Desktop |
| Amici e lettori italiani | Il racconto del percorso | Telefono |
| Yuri | Registrare ore, vedere a che punto è | Telefono (iPhone) e portatile |

## 3. Stack

| Parte | Scelta | Perché |
| --- | --- | --- |
| Framework | Astro + isole React | Sito di contenuti veloce, zero JS dove non serve; Yuri conosce React |
| Stile | Tailwind CSS | Rapido e coerente con i token di `DESIGN.md` |
| Hosting | Cloudflare Workers con file statici + adapter `@astrojs/cloudflare` | Gratuito; è la strada che Cloudflare consiglia per i progetti nuovi |
| Database | Cloudflare D1 | Gratuito, SQLite, accesso diretto dal Worker |
| Login | Cloudflare Access (Zero Trust, piano Free) | Protezione vera al bordo, nessuna gestione di password |
| Test | Vitest | Logica delle date e delle statistiche |
| Validazione | zod | Input delle API |
| JWT | jose | Verifica del token di Access |

Pagine pubbliche e shell della dashboard sono prerenderizzate. Solo le API e il redirect della home sono on-demand (`export const prerender = false`).

## 4. Architettura

```
Browser
  │
  ▼
Cloudflare (bordo)
  ├── Access ── protegge /dashboard* e /api/private/*  (login con codice via email)
  │
  ▼
Worker (Astro + adapter Cloudflare)
  ├── file statici: pagine pubbliche /it/*, /en/*, shell di /dashboard
  ├── /                     → redirect alla lingua del browser (default EN)
  ├── /api/public/progress  → dati aggregati pubblici (cache 5 min)
  └── /api/private/*        → verifica JWT di Access → D1
                                   │
                                   ▼
                              D1 (weeks, sessions, milestones, settings)

Contenuti pubblici (devlog, progetti, fasi): file Markdown/JSON nel repository
```

## 5. Mappa del sito

### Pubblico (ogni pagina esiste in `/it/` e `/en/`)

| Percorso EN | Percorso IT | Contenuto |
| --- | --- | --- |
| `/en/` | `/it/` | Home |
| `/en/devlog/` | `/it/devlog/` | Elenco post, filtro per tag |
| `/en/devlog/[slug]/` | `/it/devlog/[slug]/` | Post |
| `/en/projects/` | `/it/progetti/` | Griglia dei progetti |
| `/en/projects/[slug]/` | `/it/progetti/[slug]/` | Pagina progetto |
| `/en/roadmap/` | `/it/percorso/` | Fasi e traguardi |
| `/en/about/` | `/it/chi-sono/` | Bio, competenze, contatti |
| `/en/rss.xml` | `/it/rss.xml` | Feed RSS del devlog per lingua |
| `/404` | | Pagina 404 bilingue |

### Privato (solo IT, protetto)

| Percorso | Contenuto |
| --- | --- |
| `/dashboard/` | Panoramica |
| `/dashboard/registra/` | Registra una sessione (pagina principale da telefono) |
| `/dashboard/settimane/` | Le 104 settimane |
| `/dashboard/traguardi/` | I 21 traguardi |
| `/dashboard/impostazioni/` | Data di inizio, obiettivo ore, cosa mostrare in pubblico, esportazione |

## 6. Parte pubblica

### 6.1 Home
- Hero: nome, una riga sull'obiettivo, la fase corrente con il numero della settimana ("Settimana 12 di 104 · Fase 1 — Fondamenti e C++").
- Barra di avanzamento: traguardi raggiunti su quelli pubblici.
- Ultimi 3 post del devlog.
- Fino a 3 progetti in evidenza (`featured: true`), altrimenti i più recenti con stato diverso da `planned`.
- Link al percorso completo.
- I dati di avanzamento arrivano da `/api/public/progress` con una piccola isola; se la chiamata fallisce si mostra la fase calcolata in build, senza errori visibili.

### 6.2 Devlog
- Post in Markdown, cartelle separate per lingua. Un post può esistere in una sola lingua o in entrambe, collegate da `translationKey`.
- Se manca la traduzione, la pagina mostra un avviso con il link alla lingua disponibile.
- Elenco con data, titolo, descrizione, tag, tempo di lettura. Filtro per tag senza JS (pagine `/devlog/tag/[tag]/`).
- I post con `draft: true` non vengono pubblicati.

### 6.3 Progetti
- Dati di partenza in `data/seed/progetti.json` (convertili in una content collection).
- Card: nome, fase, stato (`planned`, `in_progress`, `done`), tecnologie, immagine o GIF se presente.
- Pagina progetto: descrizione, video o GIF, screenshot, link a GitHub e itch.io, "cosa ho imparato", post del devlog collegati.
- I progetti `hidden: true` non compaiono.
- Filtro per stato e per fase.

### 6.4 Percorso
- Timeline verticale delle fasi da `data/seed/fasi.json` (stile "strada notturna", vedi `DESIGN.md`), con date calcolate dalla data di inizio.
- Traguardi pubblici con stato e data prevista; quelli raggiunti mostrano la data effettiva.
- Fase corrente evidenziata.
- Nota in fondo: "Le date sono indicative e si aggiornano se il piano si sposta."

### 6.5 Chi sono
- Bio breve, competenze attuali (aggiornabili), strumenti, link (GitHub, itch.io, LinkedIn), email offuscata.
- Disclaimer di non affiliazione (testo in `CONTENUTI.md`).
- Spazio per il CV in PDF (inglese), da aggiungere più avanti.

### 6.6 Elementi comuni
- Selettore di lingua su ogni pagina che porta alla pagina equivalente.
- Tema scuro di default, interruttore chiaro/scuro (preferenza salvata in localStorage dentro try/catch).
- Footer con disclaimer, link social, RSS.

## 7. Area privata

Tutte le pagine sono mobile-first: pensate per un iPhone usato a una mano.

### 7.1 Panoramica `/dashboard/`
- Settimana corrente (numero, date, obiettivo, fase), ore della settimana rispetto all'obiettivo (default 22), barra di avanzamento.
- Totali: ore complessive, settimane con stato `fatta`, media ore delle settimane con ore > 0, serie di giorni consecutivi con almeno una sessione.
- Grafico a barre SVG delle ultime 12 settimane, con linea dell'obiettivo.
- Prossimi 3 traguardi non raggiunti.
- Pulsante grande "Registra sessione".

### 7.2 Registra sessione `/dashboard/registra/`
- Campi: data (default oggi, fuso Europe/Rome), durata con pulsanti rapidi 30 / 60 / 90 / 120 minuti più campo libero, categoria, nota (facoltativa), link (facoltativo).
- Categorie: `cpp`, `matematica`, `progetto`, `corso`, `lettura`, `game_jam`, `altro` (etichette italiane nell'interfaccia).
- Dopo il salvataggio: conferma, ore aggiornate della settimana, ultime 5 sessioni con possibilità di eliminarle (con conferma).

### 7.3 Settimane `/dashboard/settimane/`
- Elenco delle 104 settimane, con la corrente in evidenza e scroll automatico su di essa.
- Per settimana: numero, date, fase, obiettivo, ore (calcolate dalle sessioni), stato (`da_fare`, `in_corso`, `fatta`, `saltata`), note, link.
- Modifica in linea di stato, obiettivo, note, link.

### 7.4 Traguardi `/dashboard/traguardi/`
- 21 traguardi da `data/seed/traguardi.json`.
- Modifica: stato (`da_fare`, `in_corso`, `raggiunto`, `in_ritardo`), data raggiunta, note, interruttore "pubblico".
- In ritardo viene suggerito (non impostato da solo) quando la data prevista è passata.

### 7.5 Impostazioni `/dashboard/impostazioni/`
- Data di inizio del piano (default 2026-11-30): cambiandola si spostano tutte le date.
- Obiettivo di ore settimanali (default 22).
- Cosa mostrare in pubblico: ore totali sì/no (default no).
- Esporta tutto in JSON e le sessioni in CSV.
- Importa sessioni da CSV (per il foglio tracker che Yuri usava prima), con anteprima prima di salvare.

## 8. Database D1

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- start_date = '2026-11-30', weekly_target_hours = '22', public_show_hours = 'false'

CREATE TABLE weeks (
  n          INTEGER PRIMARY KEY CHECK (n BETWEEN 1 AND 104),
  phase_id   TEXT NOT NULL,
  goal       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'da_fare'
             CHECK (status IN ('da_fare','in_corso','fatta','saltata')),
  notes      TEXT,
  link       TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,              -- YYYY-MM-DD
  minutes    INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 960),
  category   TEXT NOT NULL,
  note       TEXT,
  link       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_date ON sessions(date);

CREATE TABLE milestones (
  id           TEXT PRIMARY KEY,
  title_it     TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  due_date     TEXT NOT NULL,
  phase_id     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'da_fare'
               CHECK (status IN ('da_fare','in_corso','raggiunto','in_ritardo')),
  reached_date TEXT,
  notes        TEXT,
  is_public    INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL
);
```

- Migrazioni in `migrations/` (`0001_init.sql`, `0002_seed.sql`).
- `0002_seed.sql` è generato da `scripts/generate-seed.mjs` a partire da `data/seed/settimane.json` e `data/seed/traguardi.json`.
- Le date delle settimane non si salvano: inizio settimana n = `start_date` + 7 × (n − 1), fine = inizio + 6 giorni.
- Settimana corrente = floor((oggi − start_date) / 7) + 1. Prima dell'inizio vale 0 ("si parte il…"); dopo la 104 vale 104 con stato "piano completato".
- Le ore di una settimana sono la somma dei minuti delle sessioni con data tra inizio e fine, divisa per 60.
- Le fasi stanno in `data/seed/fasi.json` (non nel database): ogni fase ha un intervallo di settimane, quindi le sue date si spostano con `start_date`.

## 9. API

Risposte JSON. Errori nel formato `{ "error": "messaggio" }` con codice HTTP adatto.

### Pubblica

`GET /api/public/progress` — header `Cache-Control: public, max-age=300`

```json
{
  "currentWeek": 12,
  "totalWeeks": 104,
  "currentPhaseId": "f1",
  "milestones": { "reached": 2, "total": 19 },
  "publicMilestones": [
    { "id": "m01", "status": "raggiunto", "reached_date": "2026-12-12" },
    { "id": "m02", "status": "in_corso", "reached_date": null }
  ],
  "totalHours": 210.5
}
```

- `publicMilestones` contiene solo id, stato e data: titoli e date previste la pagina Percorso li prende da `traguardi.json` in build.
- Conta e restituisce solo i traguardi con `is_public = 1`.
- `totalHours` è presente solo se `public_show_hours = 'true'`.
- Nessun altro campo: niente note, sessioni, obiettivi settimanali.

### Privata (tutte sotto `/api/private/`, JWT obbligatorio)

| Metodo | Percorso | Funzione |
| --- | --- | --- |
| GET | `/overview` | Dati della panoramica |
| GET | `/sessions?from=&to=` | Sessioni in un intervallo |
| POST | `/sessions` | Nuova sessione |
| DELETE | `/sessions/:id` | Elimina sessione |
| GET | `/weeks` | Tutte le settimane con date e ore calcolate |
| PATCH | `/weeks/:n` | Aggiorna stato, obiettivo, note, link |
| GET | `/milestones` | Tutti i traguardi |
| PATCH | `/milestones/:id` | Aggiorna stato, data, note, pubblico |
| GET | `/settings` | Impostazioni |
| PATCH | `/settings` | Aggiorna impostazioni |
| GET | `/export.json` | Backup completo |
| GET | `/sessions.csv` | Sessioni in CSV |
| POST | `/import/sessions` | Importa CSV (`dryRun=true` per l'anteprima) |

## 10. Login e sicurezza

1. **Access al bordo.** Applicazione self-hosted sul dominio `*.workers.dev` del Worker, percorsi `/dashboard*` e `/api/private/*`. Policy Allow con la sola email di Yuri, accesso con One-time PIN. La configura Yuri nel pannello (istruzioni in `LEGGIMI.md`).
2. **Verifica nel Worker.** Un middleware su `/api/private/*` verifica `Cf-Access-Jwt-Assertion` con `jose`: chiavi da `https://<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs`, controllo di `aud = ACCESS_AUD`, `iss` e scadenza. Token assente o non valido: 401.
3. **Variabili.** `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` come variabili del Worker; nessuna delle due va nel codice.
4. **Sviluppo locale.** Con `DEV_BYPASS_AUTH=true` in `.dev.vars` il middleware lascia passare, ma solo se la richiesta arriva da localhost. In produzione la variabile non esiste e il codice la ignora comunque se l'host non è locale.
5. **URL di anteprima.** Disattiva gli URL di anteprima del Worker oppure proteggili tutti con Access, così i percorsi privati non sono raggiungibili da un indirizzo non protetto.
6. **Robot.** `robots.txt` esclude `/dashboard` e `/api`; le pagine della dashboard hanno `noindex`.
7. **Input.** Tutto validato con zod; SQL solo con parametri.
8. **Header.** Content-Security-Policy restrittiva, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

## 11. Lingue

- Lingue: `en` (predefinita) e `it`, entrambe con prefisso nell'URL.
- `/` reindirizza in base all'header `Accept-Language` (italiano → `/it/`, tutto il resto → `/en/`).
- Testi dell'interfaccia in `src/i18n/en.json` e `src/i18n/it.json`; una funzione `t(lang, key)` con controllo dei tipi sulle chiavi.
- Tag `hreflang` e `link rel="alternate"` su ogni pagina; `lang` corretto su `<html>`.
- Date formattate con `Intl.DateTimeFormat` nella lingua della pagina.

## 12. Contenuti

### Devlog — `src/content/devlog/{it,en}/*.md`

```yaml
title: string
description: string          # max 160 caratteri
date: 2026-11-30
tags: [cpp, cs50, raylib]    # in minuscolo, inglese
translationKey: si-parte     # uguale nelle due lingue
draft: false
cover: ./cover.png           # facoltativo
project: pong                # facoltativo, slug del progetto collegato
```

Sposta la bozza di `content/devlog/` del kit in `src/content/devlog/`.

### Progetti — da `data/seed/progetti.json`

Campi: `slug`, `name_it`, `name_en`, `phase_id`, `status`, `tech[]`, `summary_it`, `summary_en`, `github`, `itch`, `video`, `cover`, `featured`, `hidden`, `weeks` ([inizio, fine]). Più avanti ogni progetto può avere una pagina Markdown per lingua con il racconto completo.

### Fasi — da `data/seed/fasi.json`

Campi: `id`, `order`, `name_it`, `name_en`, `weeks` ([inizio, fine] oppure `null`), `label_it`, `label_en` (per le fasi future senza settimane), `summary_it`, `summary_en`, `gate_it`, `gate_en`, `parallel`.

## 13. Qualità

- Lighthouse ≥ 95 in prestazioni, accessibilità, buone pratiche e SEO sulle pagine pubbliche (mobile).
- Nessun JS sulle pagine di contenuto oltre all'isola dell'avanzamento e all'interruttore del tema.
- Font ospitati in locale (`@fontsource`), immagini con `astro:assets`.
- `@astrojs/sitemap` (senza `/dashboard`), feed RSS per lingua, immagine Open Graph di default per lingua.
- Test Vitest per: settimana corrente, date di una settimana, ore per settimana, serie di giorni, media, filtro dei dati pubblici.

## 14. Ambienti e pubblicazione

| Ambiente | Come |
| --- | --- |
| Locale | `npm run dev` con D1 locale (Wrangler) e `DEV_BYPASS_AUTH=true` |
| Produzione | Worker su `*.workers.dev`, deploy automatico da `main` con Workers Builds collegato al repository GitHub privato |

- Nome del Worker suggerito: `yuri-gamedev` (chiedi conferma).
- `wrangler.jsonc` con binding D1 `DB`, binding agli asset, variabili `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD`.
- In alternativa a Workers Builds: GitHub Actions con `wrangler deploy` e un token API salvato nei secret del repository. Proponilo solo se Yuri lo chiede.

## 15. Milestone di sviluppo

Ogni milestone termina con `npm run check`, `npm run test`, `npm run build` puliti, un commit e un riepilogo per Yuri.

**M0 — Base del progetto**
- Progetto Astro + TypeScript strict + Tailwind + React + adapter Cloudflare + Vitest.
- `wrangler.jsonc`, `.gitignore` (con `.dev.vars`), `.dev.vars.example`, script npm della sezione Comandi di `CLAUDE.md`.
- Token di design di `DESIGN.md` nella configurazione di Tailwind e in variabili CSS.
- Aggiorna la sezione Comandi di `CLAUDE.md`.
- Fatto quando: `npm run dev` mostra una pagina vuota con lo stile di base.

**M1 — Struttura pubblica e lingue**
- Layout, header con navigazione, selettore di lingua, footer con disclaimer, tema chiaro/scuro.
- Routing `/it/` e `/en/`, redirect di `/`, file di traduzione, `hreflang`, pagina 404.
- Pagine Home e Chi sono con i testi di `CONTENUTI.md`.
- Fatto quando: si naviga in entrambe le lingue e ogni pagina ha la sua equivalente.

**M2 — Devlog**
- Content collection con lo schema della sezione 12, elenco, pagina post, tag, tempo di lettura, avviso di traduzione mancante, RSS per lingua.
- Bozza del primo post spostata in `src/content/devlog/`.
- Fatto quando: un post di prova appare nelle due lingue e i post `draft` non vengono pubblicati.

**M3 — Progetti e Percorso**
- Collection dei progetti da `progetti.json`, griglia con filtri, pagina progetto.
- Pagina Percorso con timeline delle fasi e traguardi, calcolata in build da `fasi.json` e `traguardi.json`.
- Fatto quando: progetti e percorso sono navigabili nelle due lingue.

**M4 — Database e dashboard (in locale)**
- Migrazioni D1, script di generazione del seed, API private e pubblica, middleware JWT con bypass locale.
- Pagine della dashboard come isole React: Panoramica, Registra, Settimane, Traguardi, Impostazioni (esportazione e importazione CSV comprese).
- Home e Percorso leggono `/api/public/progress` con fallback.
- Test della logica di calcolo.
- Fatto quando: in locale si registra una sessione dal telefono (stessa rete) e la panoramica si aggiorna.

**M5 — Pubblicazione e Access** (con conferma prima di ogni passo remoto)
- Yuri esegue `npx wrangler login`. Crea il database D1 remoto e applica le migrazioni remote.
- Primo deploy sul dominio `*.workers.dev`.
- Guida Yuri nella configurazione di Access (`LEGGIMI.md`, passo 7) e imposta `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD`.
- Disattiva o proteggi gli URL di anteprima.
- Collega Workers Builds al repository privato.
- Fatto quando: `/dashboard` chiede il codice via email, `/api/private/overview` senza login risponde 401 o la pagina di login, le pagine pubbliche si vedono senza login.

**M6 — Rifinitura**
- Lighthouse, accessibilità con tastiera e screen reader, immagini Open Graph, sitemap, header di sicurezza.
- Revisione dei testi con Yuri.
- Fatto quando: i criteri della sezione 13 sono rispettati.

## 16. Fuori dallo scopo, per ora

- Dominio personalizzato (si aggiunge dopo dal pannello Cloudflare).
- Commenti ai post e newsletter.
- Editor dei post dal browser: i post si scrivono in Markdown e si pubblicano con un push.
- Più utenti nell'area privata.

## 17. Domande aperte (da chiedere a Yuri alla Milestone 0)

1. Nome del Worker e quindi dell'indirizzo (`yuri-gamedev` va bene?).
2. Link da mostrare in "Chi sono": GitHub, itch.io, LinkedIn, email di contatto.
3. Mostrare in pubblico le ore totali di studio? (Default: no.)
4. Raccontare in "Chi sono" che oggi lavora come autista soccorritore? (È nella bozza, ma decide lui.)
