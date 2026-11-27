const dateFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateLongFmt = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "30 nov" from an ISO date. */
export function shortDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T00:00:00Z`));
}

export function longDate(iso: string): string {
  return dateLongFmt.format(new Date(`${iso}T00:00:00Z`));
}

/** 1.5 -> "1,5". */
export function hours(value: number): string {
  return value.toLocaleString('it-IT', { maximumFractionDigits: 1 });
}

/** 90 -> "1 h 30 min". */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
