import { useState } from 'react';
import type { MilestoneView } from '../../lib/types';
import type { MilestoneStatus } from '../../lib/progress';
import { MILESTONE_STATUSES } from '../../lib/categories';
import { PHASES } from '../../lib/phases';
import { api, errorMessage } from './api';
import { useApi } from './useApi';
import { ErrorBox, Loading, STATUS_LABEL, StatusPill, inputClass } from './ui';
import { longDate, shortDate } from './format';

export default function Milestones() {
  const { data, setData, error, loading, reload } = useApi<{ milestones: MilestoneView[] }>('/api/private/milestones');

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const reached = data.milestones.filter((m) => m.status === 'raggiunto').length;
  const onSaved = (m: MilestoneView) => setData({ milestones: data.milestones.map((x) => (x.id === m.id ? m : x)) });

  return (
    <div className="space-y-3">
      <p className="font-mono text-sm text-muted">
        {reached} / {data.milestones.length} raggiunti
      </p>
      <ol className="space-y-3">
        {data.milestones.map((m) => (
          <li key={m.id}>
            <MilestoneItem milestone={m} onSaved={onSaved} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function MilestoneItem({ milestone: m, onSaved }: { milestone: MilestoneView; onSaved: (m: MilestoneView) => void }) {
  const [editing, setEditing] = useState(false);
  const phase = PHASES.find((p) => p.id === m.phase_id);

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted">
            {m.id.toUpperCase()} · F{phase?.order} · previsto {shortDate(m.due_date)}
            {!m.is_public && ' · privato'}
          </p>
          <p className="mt-1">{m.title_it}</p>
        </div>
        <StatusPill status={m.status} />
      </div>
      {m.reached_date && m.status === 'raggiunto' && (
        <p className="mt-2 font-mono text-xs text-accent-2">Raggiunto il {longDate(m.reached_date)}</p>
      )}
      {m.suggest_late && (
        <p className="mt-2 text-sm text-danger">La data prevista è passata: vuoi segnarlo «in ritardo»?</p>
      )}
      {!editing && m.notes && <p className="mt-2 whitespace-pre-line text-sm text-muted">{m.notes}</p>}
      {editing ? (
        <MilestoneEditor
          milestone={m}
          onCancel={() => setEditing(false)}
          onSaved={(x) => {
            onSaved(x);
            setEditing(false);
          }}
        />
      ) : (
        <button type="button" className="btn mt-3 min-h-11" onClick={() => setEditing(true)} aria-label={`Modifica il traguardo ${m.title_it}`}>
          Modifica
        </button>
      )}
    </article>
  );
}

function MilestoneEditor({
  milestone: m,
  onCancel,
  onSaved,
}: {
  milestone: MilestoneView;
  onCancel: () => void;
  onSaved: (m: MilestoneView) => void;
}) {
  const [status, setStatus] = useState<MilestoneStatus>(m.suggest_late ? 'in_ritardo' : m.status);
  const [reachedDate, setReachedDate] = useState(m.reached_date ?? '');
  const [notes, setNotes] = useState(m.notes ?? '');
  const [isPublic, setIsPublic] = useState(m.is_public);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = `ms-${m.id}`;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { status, notes, is_public: isPublic };
      if (status === 'raggiunto') {
        if (reachedDate) body.reached_date = reachedDate;
      } else {
        body.reached_date = null;
      }
      const res = await api.patch<{ milestone: MilestoneView }>(`/api/private/milestones/${m.id}`, body);
      onSaved(res.milestone);
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
        <select id={`${id}-status`} className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)}>
          {MILESTONE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {status === 'raggiunto' && (
        <div>
          <label htmlFor={`${id}-date`} className="mb-1 block text-sm text-muted">
            Data raggiunta <span className="text-xs">(vuota = oggi)</span>
          </label>
          <input id={`${id}-date`} type="date" className={inputClass} value={reachedDate} onChange={(e) => setReachedDate(e.target.value)} />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-notes`} className="mb-1 block text-sm text-muted">
          Note <span className="text-xs">(sempre private)</span>
        </label>
        <textarea id={`${id}-notes`} rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        <span>Mostra sul sito pubblico</span>
      </label>
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
