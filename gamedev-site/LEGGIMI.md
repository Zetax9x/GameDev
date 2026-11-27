# Kit per Claude Code — il sito del tuo percorso da game programmer

Questo kit contiene tutto ciò che serve a Claude Code per costruire il tuo sito:

- **Parte pubblica, in italiano e inglese:** devlog, progetti (i tuoi giochi), percorso con fasi e traguardi, pagina "chi sono". Col tempo diventa il tuo portfolio per i recruiter.
- **Area privata protetta da login:** dashboard per registrare le ore di studio anche dal telefono, seguire le 104 settimane del piano e aggiornare i traguardi.

Costo: zero, restando nei limiti gratuiti di Cloudflare.

---

## Perché Cloudflare e non GitHub Pages

GitHub Pages pubblica solo file statici, visibili a chiunque: non può proteggere un'area privata né salvare le ore che registri.

Cloudflare offre gratis tutte e tre le cose che servono:

| Serve | Servizio Cloudflare | Piano gratuito |
| --- | --- | --- |
| Hosting del sito e delle API | Workers con file statici | Sì |
| Database per ore, settimane e traguardi | D1 (SQLite) | 5 milioni di righe lette e 100.000 scritte al giorno: il tuo uso sarà minuscolo |
| Login per l'area privata | Access (Zero Trust) | Gratis fino a 50 utenti |

Senza dominio il sito avrà un indirizzo gratuito del tipo `nome-progetto.tuo-account.workers.dev`. Un dominio vero (es. `nomecognome.dev`) si aggiunge in seguito senza rifare nulla.

---

## Cosa c'è nel kit

| File | A cosa serve |
| --- | --- |
| `LEGGIMI.md` | Questo file: istruzioni per te |
| `PROMPT_INIZIALE.md` | Il messaggio da incollare in Claude Code per iniziare |
| `CLAUDE.md` | Le regole del progetto: Claude Code lo legge in automatico a ogni sessione |
| `docs/SPEC.md` | Specifica completa: pagine, database, API, sicurezza, milestone di sviluppo |
| `docs/DESIGN.md` | Stile grafico: colori, caratteri, componenti |
| `docs/CONTENUTI.md` | Testi delle pagine in italiano e inglese, da personalizzare |
| `data/seed/*.json` | Dati iniziali: 104 settimane, 21 traguardi, fasi, progetti |
| `content/devlog/` | Bozza del primo post, in italiano e inglese |

---

## Cosa ti serve prima di iniziare

- [ ] Node.js versione LTS installato sul portatile
- [ ] Git installato e un account GitHub
- [ ] Claude Code installato
- [ ] Un account Cloudflare gratuito (cloudflare.com)
- [ ] 10 minuti per personalizzare `docs/CONTENUTI.md` (bio, link, email)

---

## I passi

1. Crea una cartella vuota sul portatile, per esempio `gamedev-site`, ed estrai lì il contenuto di questo kit.
2. Apri il terminale nella cartella e scrivi `git init`.
3. Avvia Claude Code scrivendo `claude`.
4. Incolla il testo di `PROMPT_INIZIALE.md` e invia.
5. Claude Code legge i documenti, ti fa un riepilogo e propone il piano della prima milestone. Si lavora **una milestone alla volta**: lui propone, tu approvi.
6. Alla milestone 4 (database e dashboard) ti chiederà di collegarti a Cloudflare: lancia `npx wrangler login` e conferma nel browser.
7. Alla milestone 5 configuri il login dell'area privata. Claude Code ti guida; la parte nel pannello Cloudflare la fai tu:
   1. Pannello Cloudflare → **Zero Trust** → crea l'organizzazione e scegli il piano **Free**. Cloudflare chiede comunque i dati di pagamento, ma con il piano gratuito non addebita nulla.
   2. **Access → Applications → Add an application → Self-hosted**.
   3. Dominio: quello del tuo sito `.workers.dev`. Percorsi da proteggere: `/dashboard*` e `/api/private/*`.
   4. Policy: **Allow**, regola **Emails**, la tua email. Metodo di accesso: **One-time PIN** (ricevi un codice via email).
   5. Copia l'**Application Audience (AUD) Tag** e il **team domain** (`tuoteam.cloudflareaccess.com`) e dalli a Claude Code.
8. Crea su GitHub un repository **privato** e collegalo a Cloudflare (Workers Builds): a ogni push sul ramo `main` il sito si aggiorna da solo.

---

## Prima di pubblicare, personalizza

- [ ] `docs/CONTENUTI.md`: bio, link a GitHub, LinkedIn e itch.io, email di contatto
- [ ] Il primo post del devlog (`content/devlog/`): è una bozza, riscrivila con parole tue
- [ ] La tua email al posto di `LA_TUA_EMAIL` in `CLAUDE.md`

---

## E il foglio tracker?

La dashboard del sito prende il posto del foglio. Se nel frattempo hai già segnato delle ore nel foglio, scaricalo in CSV dalla pagina del foglio e chiedi a Claude Code di importarlo nel database.
