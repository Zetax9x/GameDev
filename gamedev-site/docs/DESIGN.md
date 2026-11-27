# DESIGN — Sito "Game Dev Journey"

## Idea

**Un viaggio notturno in città.** Il percorso è una strada di notte: le fasi sono tratti di strada, i traguardi sono le uscite, la fase corrente è il punto illuminato. Atmosfera calma e notturna, luci ambra dei lampioni, dettagli da editor di codice.

L'identità è **originale**: nessun richiamo grafico a Rockstar, GTA o altri giochi. Niente loghi, font, palette o illustrazioni che li imitino (vedi `CLAUDE.md`, regola 4).

Tono visivo: pulito, leggibile, da sviluppatore. Più "devlog curato" che "sito di videogiochi urlato".

## Colori

Tema scuro di default, tema chiaro disponibile. Usa variabili CSS e mappale in Tailwind.

| Token | Scuro | Chiaro | Uso |
| --- | --- | --- | --- |
| `--bg` | `#0E0F12` | `#F7F6F2` | Sfondo pagina |
| `--surface` | `#16181D` | `#FFFFFF` | Card, pannelli |
| `--surface-2` | `#1E2128` | `#EFEDE7` | Card in evidenza, input |
| `--border` | `#2A2E37` | `#DDD9CF` | Bordi e separatori |
| `--text` | `#ECEAE4` | `#16181D` | Testo principale |
| `--text-muted` | `#A3A3AB` | `#5C5E66` | Testo secondario |
| `--accent` | `#F5A524` | `#B86E00` | Ambra: fase corrente, link, pulsante principale |
| `--accent-2` | `#2EC4B6` | `#127A71` | Teal: stato "fatto", grafici |
| `--danger` | `#F26D6D` | `#B42318` | Errori, "in ritardo" |

- Verifica il contrasto AA di ogni coppia testo/sfondo in entrambi i temi; correggi i valori se serve.
- L'ambra è l'unico colore forte: usalo per una cosa per schermata (la fase corrente, il pulsante principale).
- Stati: `planned` / `da_fare` grigio, `in_progress` / `in_corso` ambra, `done` / `fatta` / `raggiunto` teal, `in_ritardo` rosso.

## Caratteri

| Ruolo | Font | Note |
| --- | --- | --- |
| Titoli | Space Grotesk 600 | Ospitato in locale con `@fontsource` |
| Testo | Inter 400 / 500 | Corpo 17 px su desktop, 16 px su telefono, interlinea 1,6 |
| Codice e dettagli | JetBrains Mono 400 | Numeri di settimana, date, tag, blocchi di codice |

Scala: 14 · 16 · 17 · 20 · 24 · 32 · 44 px. Larghezza massima del testo dei post: 68 caratteri circa.

## Layout

- Contenitore massimo 1120 px; testo dei post 680 px.
- Spaziatura su griglia di 8 px.
- Header semplice: nome a sinistra, navigazione al centro o a destra, lingua e tema a destra. Su telefono: menu a scomparsa.
- Angoli 10 px sulle card, 999 px sui tag e sui pulsanti a pillola.
- Niente ombre pesanti né gradienti vistosi: i livelli si distinguono con `--surface` e `--border`.

## Componenti chiave

**Indicatore di fase (home).** Riga in JetBrains Mono: `SETTIMANA 12 / 104 · FASE 1`, sotto il nome della fase. Barra sottile di avanzamento in ambra.

**Timeline "strada notturna" (Percorso).** Linea verticale tratteggiata come una corsia; ogni fase è un tratto con nome, date e una riga di descrizione; i traguardi sono piccoli cartelli d'uscita (rombo o rettangolo arrotondato) accanto alla linea. Tratti passati in teal, fase corrente in ambra con un leggero alone, fasi future in grigio. La Fase 2 (in parallelo) è affiancata, tratteggiata. Con `prefers-reduced-motion` nessuna animazione.

**Card progetto.** Immagine 16:9 (o un segnaposto disegnato con forme geometriche, non foto stock), nome, pillola di stato, tecnologie in JetBrains Mono, fase.

**Post del devlog.** Data e tag in mono sopra il titolo; blocchi di codice con evidenziazione (tema scuro coerente con la palette); immagini a tutta larghezza del testo.

**Dashboard (privata).**
- Mobile-first: un'azione principale per schermata, pulsanti alti almeno 48 px.
- "Registra sessione": pulsanti grandi 30 / 60 / 90 / 120 minuti in griglia 2×2, categorie come pillole selezionabili, pulsante "Salva" fisso in basso.
- Grafico ore settimanali: barre SVG teal, linea tratteggiata ambra per l'obiettivo, etichette in mono.
- Barra di navigazione in basso su telefono: Panoramica, Registra, Settimane, Traguardi.

## Movimento

- Transizioni brevi (150–200 ms) su hover e focus.
- Nessuna animazione di caricamento elaborata.
- Tutto disattivato con `prefers-reduced-motion`.

## Immagini

- Screenshot e GIF dei giochi di Yuri sono il cuore visivo del sito: devono avere spazio.
- Segnaposto per i progetti non ancora iniziati: forme geometriche semplici con i colori del tema e il nome del progetto.
- Immagine Open Graph di default per lingua: sfondo `--bg`, nome, sottotitolo, una linea ambra a forma di strada.

## Da evitare

- Qualunque somiglianza con loghi, font o grafica di Rockstar, GTA o altri giochi.
- Foto stock di "gamer", controller e neon a caso.
- Più di un colore forte nella stessa schermata.
- Testo grigio chiaro su sfondo scuro sotto il contrasto AA.
