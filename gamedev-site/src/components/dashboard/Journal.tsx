import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { JournalEntry } from '../../lib/types';
import { todayInRome } from '../../lib/plan';
import { AUTONOMY_LABELS } from '../../lib/method';
import { api, errorMessage } from './api';
import { Card, ErrorBox, inputClass } from './ui';
import AutonomyChart from './AutonomyChart';
import { longDate } from './format';

type Fields = Pick<JournalEntry, 'topics' | 'exercises' | 'errors' | 'unclear' | 'next_goal'>;

const FIELDS: { key: keyof Fields; label: string; placeholder: string }[] = [
  { key: 'topics', label: 'Argomenti studiati', placeholder: 'Es. cicli for e while, learncpp cap. 8' },
  { key: 'exercises', label: 'Esercizi completati', placeholder: 'Es. munizioni e ricarica, scheda personaggio' },
  { key: 'errors', label: 'Errori incontrati', placeholder: 'Errori di compilazione o logici, e come li hai risolti' },
  { key: 'unclear', label: 'Concetti ancora poco chiari', placeholder: 'Cosa ripassare' },
  { key: 'next_goal', label: 'Prossimo obiettivo', placeholder: 'Cosa fai domani' },
];

const EMPTY: Fields = { topics: '', exercises: '', errors: '', unclear: '', next_goal: '' };

export default function Journal() {
  const [date, setDate] = useState(() => todayInRome());
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [autonomy, setAutonomy] = useState<number | null>(null);
  const [exists, setExists] = useState(false);
  // The form stays disabled while the selected day loads, so typing can't be overwritten.
  const [loadingDay, setLoadingDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      setListError(null);
      const res = await api.get<{ entries: JournalEntry[] }>('/api/private/journal?limit=60');
      setEntries(res.entries);
    } catch (e) {
      setListError(errorMessage(e));
    }
  }, []);

  const loadDay = useCallback(async (day: string) => {
    setMessage(null);
    setLoadingDay(true);
    try {
      const res = await api.get<{ entry: JournalEntry | null }>(`/api/private/journal/${day}`);
      const e = res.entry;
      setExists(Boolean(e));
      setFields(
        e
          ? { topics: e.topics ?? '', exercises: e.exercises ?? '', errors: e.errors ?? '', unclear: e.unclear ?? '', next_goal: e.next_goal ?? '' }
          : EMPTY,
      );
      setAutonomy(e?.autonomy ?? null);
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    } finally {
      setLoadingDay(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) void loadDay(date);
  }, [date, loadDay]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/api/private/journal/${date}`, { ...fields, autonomy });
      setExists(true);
      setMessage({ ok: true, text: 'Diario salvato.' });
      await loadList();
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(`Eliminare la voce del diario del ${longDate(date)}?`)) return;
    try {
      await api.del(`/api/private/journal/${date}`);
      setExists(false);
      setFields(EMPTY);
      setAutonomy(null);
      setMessage({ ok: true, text: 'Voce eliminata.' });
      await loadList();
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="journal-date" className="mb-1 block text-sm text-muted">
            Giorno
          </label>
          <input id="journal-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          <p className="mt-1 text-xs text-muted">
            {loadingDay ? 'Caricamento…' : exists ? 'Stai modificando una voce già salvata.' : 'Nuova voce.'}
          </p>
        </div>

        <fieldset disabled={loadingDay} className="space-y-4">

        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`journal-${f.key}`} className="mb-1 block text-sm text-muted">
              {f.label}
            </label>
            <textarea
              id={`journal-${f.key}`}
              rows={f.key === 'next_goal' ? 2 : 3}
              maxLength={2000}
              className={inputClass}
              placeholder={f.placeholder}
              value={fields[f.key] ?? ''}
              onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
            />
          </div>
        ))}

        <fieldset>
          <legend className="mb-2 text-sm text-muted">Autonomia di oggi (1–5)</legend>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={autonomy === v}
                aria-label={`${v}: ${AUTONOMY_LABELS[v]}`}
                onClick={() => setAutonomy(autonomy === v ? null : v)}
                className={`min-h-12 rounded-[10px] border font-mono text-lg transition-colors ${
                  autonomy === v ? 'border-accent bg-accent text-on-accent' : 'border-border bg-surface'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {autonomy ? AUTONOMY_LABELS[autonomy] : 'Un voto basso non è un problema: serve a decidere cosa ripassare.'}
          </p>
        </fieldset>

        </fieldset>

        {message && (
          <p role="status" className={`text-sm ${message.ok ? 'text-accent-2' : 'text-danger'}`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1" style={{ minHeight: 52 }} disabled={saving || loadingDay}>
            {saving ? 'Salvataggio…' : 'Salva il diario'}
          </button>
          {exists && (
            <button type="button" className="btn text-danger" onClick={() => void onDelete()}>
              Elimina
            </button>
          )}
        </div>
      </form>

      <Card>
        <h2 className="text-base">Andamento dell'autonomia</h2>
        <div className="mt-3">
          <AutonomyChart entries={entries} />
        </div>
      </Card>

      <Card>
        <h2 className="text-base">Voci recenti</h2>
        {listError && <ErrorBox message={listError} onRetry={() => void loadList()} />}
        {entries.length === 0 && !listError ? (
          <p className="mt-2 text-sm text-muted">Ancora nessuna voce.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {entries.map((e) => (
              <li key={e.date}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 py-3 text-left"
                  onClick={() => {
                    setDate(e.date);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  <span className="min-w-0">
                    <span className="block text-sm">{longDate(e.date)}</span>
                    <span className="block truncate text-xs text-muted">{e.topics ?? e.exercises ?? '—'}</span>
                  </span>
                  {e.autonomy !== null && <span className="pill shrink-0 text-muted">{e.autonomy}/5</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
