import type { Overview as OverviewData } from '../../lib/types';
import { PHASES } from '../../lib/phases';
import { useApi } from './useApi';
import { Card, ErrorBox, Loading, ProgressBar, Stat, StatusPill } from './ui';
import WeeklyChart from './WeeklyChart';
import { hours, longDate, shortDate } from './format';

export default function Overview() {
  const { data, error, loading, reload } = useApi<OverviewData>('/api/private/overview');

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const week = data.currentWeek;
  const phase = week ? PHASES.find((p) => p.id === week.phase_id) : PHASES[0];
  const target = data.settings.weekly_target_hours;

  return (
    <div className="space-y-5">
      <Card>
        {data.planState === 'not_started' ? (
          <>
            <p className="font-mono text-xs tracking-wider text-muted uppercase">Prima della partenza</p>
            <h2 className="mt-1 text-xl">Si parte {longDate(data.settings.start_date)}</h2>
            <p className="mt-2 text-sm text-muted">Fase 1 · {phase?.name_it}</p>
          </>
        ) : (
          <>
            <p className="font-mono text-xs tracking-wider text-muted uppercase">
              Settimana <span className="text-accent">{week?.n}</span> / 104
              {week && ` · ${shortDate(week.start)} – ${shortDate(week.end)}`}
              {data.planState === 'completed' && ' · piano completato'}
            </p>
            <h2 className="mt-1 text-lg">{week?.goal}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>
                Fase {phase?.order} · {phase?.name_it}
              </span>
              {week && <StatusPill status={week.status} />}
            </div>
          </>
        )}
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-muted">Ore questa settimana</span>
            <span className="font-mono text-sm">
              <span className="text-lg text-text">{hours(data.weekHours)}</span> / {target} h
            </span>
          </div>
          <ProgressBar value={data.weekHours} max={target} label="Ore della settimana rispetto all'obiettivo" />
        </div>
      </Card>

      <a href="/dashboard/registra/" className="btn btn-primary w-full text-lg" style={{ minHeight: 56 }}>
        + Registra sessione
      </a>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Ore totali" value={hours(data.totals.hours)} />
        <Stat label="Settimane fatte" value={String(data.totals.weeksDone)} hint="su 104" />
        <Stat label="Media settimanale" value={`${hours(data.totals.averageHours)} h`} hint="settimane con ore" />
        <Stat label="Serie" value={`${data.totals.streakDays} ${data.totals.streakDays === 1 ? 'giorno' : 'giorni'}`} hint="consecutivi" />
      </div>

      <Card>
        <h2 className="text-base">Ultime 12 settimane</h2>
        <div className="mt-3">
          <WeeklyChart data={data.chart} target={target} current={week?.n ?? 0} />
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base">Prossimi traguardi</h2>
          <a href="/dashboard/traguardi/" className="link text-sm">
            Tutti
          </a>
        </div>
        {data.nextMilestones.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Tutti i traguardi sono raggiunti. Complimenti!</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.nextMilestones.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{m.title_it}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted">
                  {shortDate(m.due_date)}
                  <StatusPill status={m.status} />
                  {m.suggest_late && <span className="text-danger">scaduto</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
