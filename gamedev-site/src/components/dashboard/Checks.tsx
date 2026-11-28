import { useState } from 'react';
import type { CheckView } from '../../lib/types';
import { PLAN_MONTHS, monthForWeek } from '../../lib/checks-data';
import { PHASES } from '../../lib/phases';
import { api, errorMessage } from './api';
import { useApi } from './useApi';
import { ErrorBox, Loading } from './ui';
import { longDate } from './format';

interface ChecksResponse {
  currentWeek: number;
  checks: CheckView[];
}

export default function Checks() {
  const { data, setData, error, loading, reload } = useApi<ChecksResponse>('/api/private/checks');
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const current = monthForWeek(data.currentWeek)?.month ?? (data.currentWeek > 52 ? null : 1);

  async function toggle(c: CheckView) {
    if (!data) return;
    setSaveError(null);
    // Optimistic update, rolled back on error.
    const previous = data;
    setData({ ...data, checks: data.checks.map((x) => (x.id === c.id ? { ...x, done: !c.done } : x)) });
    try {
      const res = await api.patch<{ check: CheckView }>(`/api/private/checks/${c.id}`, { done: !c.done });
      setData((d) => (d ? { ...d, checks: d.checks.map((x) => (x.id === c.id ? res.check : x)) } : d));
    } catch (e) {
      setData(previous);
      setSaveError(errorMessage(e));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Non si passa all'argomento successivo solo perché è arrivato il mese previsto: si procede quando queste verifiche sono superate.
      </p>
      {saveError && <ErrorBox message={saveError} />}
      {PLAN_MONTHS.map((m) => {
        const items = data.checks.filter((c) => c.month === m.month);
        const done = items.filter((c) => c.done).length;
        const isCurrent = m.month === current;
        const phase = PHASES.find((p) => p.weeks && !p.parallel && m.weeks[0] >= p.weeks[0] && m.weeks[0] <= p.weeks[1]);
        return (
          <details key={m.month} open={isCurrent} className={`card p-4 ${isCurrent ? 'border-accent' : ''}`}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
              <span>
                <span className="block font-mono text-xs text-muted">
                  Mese {m.month} · settimane {m.weeks[0]}–{m.weeks[1]} · F{phase?.order}
                  {isCurrent && <span className="text-accent"> · ora</span>}
                </span>
                <span className="mt-1 block">{m.title}</span>
              </span>
              <span className={`pill shrink-0 ${done === items.length && items.length > 0 ? 'status-done' : 'text-muted'}`}>
                {done}/{items.length}
              </span>
            </summary>
            <ul className="mt-3 space-y-1">
              {items.map((c) => (
                <li key={c.id}>
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent-2)]"
                      checked={c.done}
                      onChange={() => void toggle(c)}
                    />
                    <span className={c.done ? 'text-muted line-through' : ''}>
                      {c.text}
                      {c.done && c.done_date && <span className="ml-2 font-mono text-xs no-underline">({longDate(c.done_date)})</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      <p className="text-xs text-muted">Il secondo anno non ha verifiche mensili: lì contano i traguardi.</p>
    </div>
  );
}
