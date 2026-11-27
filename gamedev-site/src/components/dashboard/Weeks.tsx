import { useEffect, useRef, useState } from 'react';
import type { WeekStatus, WeekView } from '../../lib/types';
import { WEEK_STATUSES } from '../../lib/categories';
import { PHASES } from '../../lib/phases';
import { api, errorMessage } from './api';
import { useApi } from './useApi';
import { ErrorBox, Loading, STATUS_LABEL, StatusPill, inputClass } from './ui';
import { hours, shortDate } from './format';

interface WeeksResponse {
  currentWeek: number;
  weeklyTarget: number;
  weeks: WeekView[];
}

export default function Weeks() {
  const { data, setData, error, loading, reload } = useApi<WeeksResponse>('/api/private/weeks');
  const currentRef = useRef<HTMLLIElement | null>(null);

  // Scroll to the current week once loaded.
  useEffect(() => {
    if (data && currentRef.current) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      currentRef.current.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [data?.currentWeek, data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const onSaved = (week: WeekView) =>
    setData({ ...data, weeks: data.weeks.map((w) => (w.n === week.n ? week : w)) });

  return (
    <ol className="space-y-3">
      {data.weeks.map((w) => (
        <li key={w.n} ref={w.n === data.currentWeek ? currentRef : undefined}>
          <WeekItem week={w} isCurrent={w.n === data.currentWeek} target={data.weeklyTarget} onSaved={onSaved} />
        </li>
      ))}
    </ol>
  );
}

function WeekItem({
  week,
  isCurrent,
  target,
  onSaved,
}: {
  week: WeekView;
  isCurrent: boolean;
  target: number;
  onSaved: (w: WeekView) => void;
}) {
  const [editing, setEditing] = useState(false);
  const phase = PHASES.find((p) => p.id === week.phase_id);

  return (
    <article className={`card p-4 ${isCurrent ? 'border-accent' : ''}`} aria-current={isCurrent ? 'date' : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">
            <span className={isCurrent ? 'text-accent' : ''}>S{week.n}</span> · {shortDate(week.start)} – {shortDate(week.end)} · F{phase?.order}
            {isCurrent && ' · in corso ora'}
          </p>
          <p className="mt-1">{week.goal}</p>
        </div>
        <StatusPill status={week.status} />
      </div>
      <p className="mt-2 font-mono text-xs text-muted">
        {hours(week.hours)} / {target} h
      </p>
      {!editing && (week.notes || week.link) && (
        <div className="mt-2 text-sm text-muted">
          {week.notes && <p className="whitespace-pre-line">{week.notes}</p>}
          {week.link && (
            <a href={week.link} className="link break-all" target="_blank" rel="noopener noreferrer">
              {week.link}
            </a>
          )}
        </div>
      )}
      {editing ? (
        <WeekEditor
          week={week}
          onCancel={() => setEditing(false)}
          onSaved={(w) => {
            onSaved(w);
            setEditing(false);
          }}
        />
      ) : (
        <button type="button" className="btn mt-3 min-h-11" onClick={() => setEditing(true)} aria-label={`Modifica la settimana ${week.n}`}>
          Modifica
        </button>
      )}
    </article>
  );
}

function WeekEditor({ week, onCancel, onSaved }: { week: WeekView; onCancel: () => void; onSaved: (w: WeekView) => void }) {
  const [status, setStatus] = useState<WeekStatus>(week.status);
  const [goal, setGoal] = useState(week.goal);
  const [notes, setNotes] = useState(week.notes ?? '');
  const [link, setLink] = useState(week.link ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = `week-${week.n}`;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch<{ week: WeekView }>(`/api/private/weeks/${week.n}`, { status, goal, notes, link });
      onSaved(res.week);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label htmlFor={`${id}-status`} className="mb-1 block text-sm text-muted">
          Stato
        </label>
        <select id={`${id}-status`} className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as WeekStatus)}>
          {WEEK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-goal`} className="mb-1 block text-sm text-muted">
          Obiettivo
        </label>
        <textarea id={`${id}-goal`} rows={2} className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-notes`} className="mb-1 block text-sm text-muted">
          Note
        </label>
        <textarea id={`${id}-notes`} rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${id}-link`} className="mb-1 block text-sm text-muted">
          Link
        </label>
        <input id={`${id}-link`} type="url" className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
      </div>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={() => void save()} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Annulla
        </button>
      </div>
    </div>
  );
}
