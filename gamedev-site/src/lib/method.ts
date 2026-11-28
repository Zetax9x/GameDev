/** Study method from the Gameplay Programmer plan (private area, Italian only). */

export const DAILY_BLOCKS = [
  { label: 'Teoria mirata', minutes: 45, what: 'Studiare un concetto preciso e annotare esempi' },
  { label: 'Esempi guidati', minutes: 60, what: 'Scrivere codice insieme alla spiegazione' },
  { label: 'Esercizi autonomi', minutes: 120, what: 'Risolvere problemi senza copiare la soluzione' },
  { label: 'Debug e revisione', minutes: 45, what: 'Correggere errori, migliorare nomi e struttura' },
  { label: 'Verifica e diario', minutes: 30, what: 'Test breve, riepilogo e annotazione dei dubbi' },
] as const;

/** Typical week: index 0 = day 1 of the plan week. */
export const WEEK_TEMPLATE = [
  'Nuovo argomento e primi esempi',
  'Esercizi guidati e applicazioni',
  'Esercizi autonomi',
  'Problemi più articolati',
  'Mini-progetto con gli argomenti della settimana',
  'Revisione, debug e verifica',
  'Ripasso leggero, documentazione e recupero (o riposo completo)',
] as const;

export const CHECK_LEVELS = [
  { level: 1, name: 'Comprensione', proof: 'Spiegare il concetto con parole tue' },
  { level: 2, name: 'Applicazione', proof: 'Risolvere un esercizio simile a un esempio' },
  { level: 3, name: 'Autonomia', proof: 'Risolvere un problema nuovo senza copiare' },
  { level: 4, name: 'Progettazione', proof: 'Integrare il concetto in un piccolo sistema' },
] as const;

export const AUTONOMY_LABELS: Record<number, string> = {
  1: 'Seguo solo con la soluzione',
  2: 'Con molti aiuti',
  3: 'Con qualche aiuto',
  4: 'Quasi da solo',
  5: 'In piena autonomia',
};
