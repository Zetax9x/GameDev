import { CATEGORIES, sessionInput, type Category, type SessionInput } from './validation';

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF). Auto-detects , or ; as separator. */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, '');
  const firstLine = input.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n') + '\r\n';
}

export interface ImportRow {
  line: number;
  ok: boolean;
  value?: SessionInput;
  error?: string;
}

const HEADER_ALIASES: Record<string, string[]> = {
  date: ['date', 'data', 'giorno'],
  minutes: ['minutes', 'minuti', 'min', 'durata (min)', 'durata'],
  hours: ['hours', 'ore', 'h'],
  category: ['category', 'categoria', 'tipo', 'attività', 'attivita'],
  note: ['note', 'nota', 'descrizione', 'cosa'],
  link: ['link', 'url'],
};

const CATEGORY_ALIASES: Record<string, Category> = {
  'c++': 'cpp',
  cpp: 'cpp',
  matematica: 'matematica',
  math: 'matematica',
  progetto: 'progetto',
  project: 'progetto',
  corso: 'corso',
  course: 'corso',
  cs50: 'corso',
  cs50x: 'corso',
  lettura: 'lettura',
  reading: 'lettura',
  libro: 'lettura',
  'game jam': 'game_jam',
  game_jam: 'game_jam',
  gamejam: 'game_jam',
  altro: 'altro',
  other: 'altro',
};

export function normalizeCategory(raw: string): Category {
  const key = raw.trim().toLowerCase();
  if ((CATEGORIES as readonly string[]).includes(key)) return key as Category;
  return CATEGORY_ALIASES[key] ?? 'altro';
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY and DD.MM.YYYY (Italian order). */
export function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return s;
  const [, d = '', mo = '', y = ''] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseNumber(raw: string): number {
  return Number(raw.trim().replace(',', '.'));
}

/** Parses an "h:mm" duration or a plain number of minutes. */
function parseMinutes(raw: string): number {
  const hm = raw.trim().match(/^(\d+):(\d{1,2})$/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  return parseNumber(raw);
}

/**
 * Converts CSV text (e.g. the old tracker sheet) to validated sessions.
 * Needs a header row with at least a date column and a minutes or hours column.
 */
export function parseSessionsCsv(text: string): { rows: ImportRow[]; error?: string } {
  const table = parseCsv(text);
  const header = table[0];
  if (!header) return { rows: [], error: 'Il file è vuoto.' };

  const cols = header.map((h) => h.trim().toLowerCase());
  const find = (key: string) => cols.findIndex((c) => HEADER_ALIASES[key]?.includes(c));
  const idx = {
    date: find('date'),
    minutes: find('minutes'),
    hours: find('hours'),
    category: find('category'),
    note: find('note'),
    link: find('link'),
  };
  if (idx.date < 0 || (idx.minutes < 0 && idx.hours < 0)) {
    return {
      rows: [],
      error: 'Intestazione non riconosciuta: servono almeno le colonne "data" e "minuti" (oppure "ore").',
    };
  }

  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  const rows: ImportRow[] = table.slice(1).map((r, i) => {
    const line = i + 2;
    const minutes =
      idx.minutes >= 0 && cell(r, idx.minutes) !== ''
        ? parseMinutes(cell(r, idx.minutes))
        : Math.round(parseNumber(cell(r, idx.hours)) * 60);
    const candidate = {
      date: normalizeDate(cell(r, idx.date)),
      minutes: Math.round(minutes),
      category: normalizeCategory(cell(r, idx.category)),
      note: cell(r, idx.note) || null,
      link: cell(r, idx.link) || null,
    };
    const parsed = sessionInput.safeParse(candidate);
    if (parsed.success) return { line, ok: true, value: parsed.data };
    const issue = parsed.error.issues[0];
    return { line, ok: false, error: `${issue?.path.join('.') ?? ''}: ${issue?.message ?? 'non valido'}` };
  });
  return { rows };
}
