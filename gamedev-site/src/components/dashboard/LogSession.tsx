import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../../lib/categories';
import { todayInRome } from '../../lib/plan';
import type { SessionRow } from '../../lib/types';
import { api, errorMessage } from './api';
import { Card, ErrorBox, ProgressBar, inputClass } from './ui';
import { duration, hours, longDate } from './format';

const QUICK_MINUTES = [30, 60, 90, 120] as const;

interface SaveResponse {
  session: SessionRow;
  week: number;
  weekHours: number;
  weeklyTarget: number;
}

export default function LogSession() {
  const [date, setDate] = useState(() => todayInRome());
  const [minutes, setMinutes] = useState<number | ''>(60);
  const [category, setCategory] = useState<Category>('cpp');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveResponse | null>(null);
  const [recent, setRecent] = useState<SessionRow[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);

  const loadRecent = useCallback(async () => {
    try {
      setRecentError(null);
      const res = await api.get<{ sessions: SessionRow[] }>('/api/private/sessions?recent=5');
      setRecent(res.sessions);
    } catch (e) {
      setRecentError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaved(null);
    if (minutes === '' || minutes < 1 || minutes > 960) {
      setError('Inserisci una durata tra 1 e 960 minuti.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<SaveResponse>('/api/private/sessions', { date, minutes, category, note, link });
      setSaved(res);
      setNote('');
      setLink('');
      await loadRecent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s: SessionRow) {
    if (!window.confirm(`Eliminare la sessione del ${longDate(s.date)} (${duration(s.minutes)})?`)) return;
    try {
      await api.del(`/api/private/sessions/${s.id}`);
      setSaved(null);
      await loadRecent();
    } catch (err) {
      setRecentError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-5 pb-28">
      <form id="log-form" onSubmit={onSubmit} className="space-y-6" noValidate>
        <div>
          <label htmlFor="date" className="mb-2 block text-sm text-muted">
            Data
          </label>
          <input id="date" type="date" className={inputClass} value={date} max="2030-12-31" onChange={(e) => setDate(e.target.value)} required />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-muted">Durata</legend>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
                className={`min-h-16 rounded-[10px] border font-mono text-lg transition-colors ${
                  minutes === m ? 'border-accent bg-accent text-on-accent' : 'border-border bg-surface'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <label htmlFor="minutes" className="mt-3 block text-sm text-muted">
            Oppure minuti esatti
          </label>
          <input
            id="minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={960}
            className={`${inputClass} mt-1`}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm text-muted">Categoria</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`min-h-12 rounded-full border px-4 transition-colors ${
                  category === c ? 'border-accent-2 text-accent-2' : 'border-border text-muted'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="note" className="mb-2 block text-sm text-muted">
            Nota <span className="text-xs">(facoltativa)</span>
          </label>
          <textarea id="note" rows={3} maxLength={1000} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cosa hai fatto?" />
        </div>

        <div>
          <label htmlFor="link" className="mb-2 block text-sm text-muted">
            Link <span className="text-xs">(facoltativo)</span>
          </label>
          <input id="link" type="url" inputMode="url" className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
        </div>

        {error && <ErrorBox message={error} />}
      </form>

      {saved && (
        <Card className="border-accent-2">
          <p role="status" className="font-medium text-accent-2">
            Sessione salvata: {duration(saved.session.minutes)} di {CATEGORY_LABELS[saved.session.category as Category] ?? saved.session.category}.
          </p>
          {saved.week > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-muted">
                Settimana {saved.week}: {hours(saved.weekHours)} / {saved.weeklyTarget} h
              </p>
              <ProgressBar value={saved.weekHours} max={saved.weeklyTarget} label="Ore della settimana" />
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="text-base">Ultime sessioni</h2>
        {recentError && <p className="mt-2 text-sm text-danger">{recentError}</p>}
        {recent.length === 0 && !recentError ? (
          <p className="mt-2 text-sm text-muted">Nessuna sessione ancora.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-mono">{duration(s.minutes)}</span> · {CATEGORY_LABELS[s.category as Category] ?? s.category}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {longDate(s.date)}
                    {s.note ? ` · ${s.note}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onDelete(s)}
                  className="min-h-11 shrink-0 rounded-full border border-border px-3 text-sm text-danger"
                  aria-label={`Elimina la sessione del ${longDate(s.date)}`}
                >
                  Elimina
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Fixed save button, reachable with the thumb (sits above the bottom navigation on phones). */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-border bg-bg/95 p-3 backdrop-blur md:bottom-0">
        <div className="mx-auto max-w-xl">
          <button type="submit" form="log-form" className="btn btn-primary w-full text-lg" style={{ minHeight: 56 }} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
