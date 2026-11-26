# CLAUDE.md — Sito "Game Dev Journey" di Yuri

Sito personale che racconta il percorso di Yuri da principiante a programmatore C++ di videogiochi, con obiettivo Rockstar Games.
Due parti: un sito pubblico bilingue (IT/EN) e un'area privata con dashboard di studio, protetta da Cloudflare Access.

Documenti da leggere prima di ogni milestone:
- `docs/SPEC.md` — cosa costruire, modello dati, API, sicurezza, milestone
- `docs/DESIGN.md` — stile grafico
- `docs/CONTENUTI.md` — testi e tono
- `data/seed/` — dati iniziali (settimane, traguardi, fasi, progetti)

## Come lavorare con Yuri

- Rispondi a Yuri **in italiano**. Codice, nomi di variabili, commenti e messaggi di commit **in inglese**.
- Yuri conosce le basi del web (React, PHP, GitHub Actions) e sta imparando a programmare seriamente. Spiega in 2–3 righe le scelte non ovvie, senza lezioni lunghe.
- Lavora **una milestone alla volta** (vedi `docs/SPEC.md`, sezione Milestone). Prima di iniziarne una, mostra il piano e aspetta l'ok.
- Alla fine di ogni milestone: `npm run check`, `npm run test`, `npm run build` senza errori, poi commit, poi un riepilogo con cosa deve fare Yuri a mano (se serve).
- Se una richiesta contraddice la SPEC, fallo notare e chiedi prima di procedere.

## Chiedi sempre conferma prima di

- deploy in produzione (`wrangler deploy` o push su `main` collegato al deploy)
- migrazioni o comandi sul database D1 **remoto** (`--remote`)
- cancellare dati, file di contenuto o tabelle
- aggiungere dipendenze pesanti o servizi esterni non previsti dalla SPEC

## Stack (deciso, non cambiarlo senza chiedere)

- Astro (ultima versione stabile) con contenuti in Markdown (content collections)
- Isole React solo dove serve interattività (dashboard, selettore lingua se necessario)
- Tailwind CSS
- Cloudflare Workers con file statici, adapter `@astrojs/cloudflare`
- Cloudflare D1 per i dati privati
- Cloudflare Access per l'area privata, con verifica del JWT nel Worker (libreria `jose`)
- Vitest per i test della logica (calcolo settimana corrente, ore, statistiche)
- TypeScript in modalità strict

## Regole non negoziabili

1. **Privacy.** Ore, sessioni, note, stati delle settimane e qualunque dato del database restano privati. Non finiscono mai nell'HTML statico, nella build o in pagine pubbliche. Si leggono solo da `/api/private/*`. L'unico endpoint pubblico è `/api/public/progress`, che restituisce solo i dati elencati nella SPEC.
2. **Doppia protezione.** Access protegge `/dashboard*` e `/api/private/*` al bordo; in più ogni handler di `/api/private/*` verifica l'header `Cf-Access-Jwt-Assertion` (firma, `aud`, scadenza). Se manca o non è valido: 401. Il bypass per lo sviluppo locale funziona solo con `DEV_BYPASS_AUTH=true` in `.dev.vars` e mai in produzione.
3. **Segreti.** Nessun segreto, token o email privata nel repository. Usa `.dev.vars` (nel `.gitignore`) e `wrangler secret`.
4. **Marchi.** Non usare loghi, font, immagini, palette riconoscibili o nomi di prodotto di Rockstar Games, GTA, Red Dead o Take-Two. "Rockstar Games" può apparire solo come testo, per dire l'obiettivo personale, con il disclaimer di non affiliazione (testo in `docs/CONTENUTI.md`). I nomi pubblici dei progetti non contengono "GTA".
5. **Bilingue.** Ogni testo dell'interfaccia pubblica passa dai file di traduzione (`src/i18n/it.json`, `src/i18n/en.json`). Nessun testo pubblico scritto a mano in un solo componente. L'area privata è solo in italiano.
6. **Leggero.** Le pagine pubbliche non caricano JavaScript se non serve. Niente librerie di grafici pesanti: i grafici della dashboard sono SVG fatti a mano.
7. **Accessibile.** Contrasto WCAG AA, navigazione da tastiera, `alt` sulle immagini, rispetto di `prefers-reduced-motion`.

## Convenzioni

- Date nel database come stringhe ISO `YYYY-MM-DD`. Il fuso di riferimento è `Europe/Rome`.
- Le date delle settimane non si salvano: si calcolano da `settings.start_date` + 7 × (n − 1). Così, se Yuri resta indietro, basta cambiare la data di inizio.
- SQL sempre con parametri (`prepare().bind()`), mai stringhe concatenate.
- Validazione degli input delle API con `zod`.
- Componenti piccoli, un file per componente, nomi in inglese.

## Comandi

(Da completare alla Milestone 0, quando il progetto esiste.)

- `npm run dev` — sviluppo locale
- `npm run check` — controllo tipi Astro/TypeScript
- `npm run test` — test Vitest
- `npm run build` — build di produzione
- `npm run db:migrate:local` / `npm run db:migrate:remote` — migrazioni D1
- `npm run deploy` — deploy (solo dopo conferma di Yuri)

## Dati di Yuri da usare

- Nome pubblico: Yuri Squarcia
- Email per la policy di Access: LA_TUA_EMAIL (Yuri la sostituisce; non metterla nel codice: va solo nella configurazione di Access)
- Data di inizio del piano: 2026-11-30 (settimana 1)
