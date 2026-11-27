/**
 * Progressive enhancement for public pages: fetches /api/public/progress and
 * updates the elements rendered at build time. On failure, the build-time
 * values stay as they are (no visible error).
 */

interface PublicProgress {
  currentWeek: number;
  totalWeeks: number;
  currentPhaseId: string | null;
  milestones: { reached: number; total: number };
  publicMilestones: { id: string; status: string; reached_date: string | null }[];
  totalHours?: number;
}

function isProgress(value: unknown): value is PublicProgress {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.currentWeek === 'number' && Array.isArray(v.publicMilestones);
}

async function load(): Promise<PublicProgress | null> {
  try {
    const res = await fetch('/api/public/progress', { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return isProgress(json) ? json : null;
  } catch {
    return null;
  }
}

function setText(selector: string, text: string): void {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) el.textContent = text;
}

function readLabels(): Record<string, string> {
  const el = document.getElementById('progress-labels');
  if (!el?.textContent) return {};
  try {
    return JSON.parse(el.textContent) as Record<string, string>;
  } catch {
    return {};
  }
}

async function run(): Promise<void> {
  if (!document.querySelector('[data-progress]')) return;
  const data = await load();
  if (!data) return;
  const labels = readLabels();
  const lang = document.documentElement.lang === 'it' ? 'it' : 'en';
  const fmt = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  });

  // Home: week, phase, milestone bar.
  if (data.currentWeek > 0) {
    setText('[data-progress="week"]', String(data.currentWeek));
    for (const el of document.querySelectorAll<HTMLElement>('[data-progress="started"]')) el.hidden = false;
    for (const el of document.querySelectorAll<HTMLElement>('[data-progress="not-started"]')) el.hidden = true;
  }
  if (data.currentPhaseId) {
    const order = labels[`order.${data.currentPhaseId}`];
    const name = labels[`phase.${data.currentPhaseId}`];
    if (order) setText('[data-progress="phase-order"]', order);
    if (name) setText('[data-progress="phase-name"]', name);
  }
  const { reached, total } = data.milestones;
  setText('[data-progress="reached"]', String(reached));
  setText('[data-progress="total"]', String(total));
  for (const bar of document.querySelectorAll<HTMLElement>('[data-progress="bar"]')) {
    const pct = total > 0 ? Math.round((reached / total) * 100) : 0;
    bar.style.width = `${pct}%`;
    bar.parentElement?.setAttribute('aria-valuenow', String(pct));
  }
  if (typeof data.totalHours === 'number') {
    setText('[data-progress="hours"]', String(data.totalHours));
    for (const el of document.querySelectorAll<HTMLElement>('[data-progress="hours-box"]')) el.hidden = false;
  }

  // Roadmap: milestone statuses.
  const tones: Record<string, string> = {
    da_fare: 'status-muted',
    in_corso: 'status-progress',
    raggiunto: 'status-done',
    in_ritardo: 'status-late',
  };
  for (const m of data.publicMilestones) {
    const item = document.querySelector<HTMLElement>(`[data-milestone="${CSS.escape(m.id)}"]`);
    if (!item) continue;
    item.dataset.state = m.status;
    const pill = item.querySelector<HTMLElement>('[data-status-for]');
    if (pill) {
      pill.classList.remove(...Object.values(tones));
      pill.classList.add(tones[m.status] ?? 'status-muted');
      const label = pill.querySelector('.status-label');
      const text = labels[`status.${m.status}`];
      if (label && text) label.textContent = text;
    }
    const reachedEl = item.querySelector<HTMLElement>('[data-reached]');
    if (reachedEl && m.reached_date) {
      reachedEl.hidden = false;
      const value = reachedEl.querySelector('[data-reached-value]');
      if (value) value.textContent = fmt.format(new Date(`${m.reached_date}T12:00:00Z`));
    }
  }
}

void run();
