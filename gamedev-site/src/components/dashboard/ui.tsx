import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card p-5 ${className}`}>{children}</section>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card border-danger p-4 text-sm">
      <p className="text-danger">{message}</p>
      {onRetry && (
        <button type="button" className="btn mt-3" onClick={onRetry}>
          Riprova
        </button>
      )}
    </div>
  );
}

export function Loading({ label = 'Caricamento…' }: { label?: string }) {
  return (
    <p className="py-10 text-center font-mono text-sm text-muted" role="status">
      {label}
    </p>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
      {hint && <p className="font-mono text-xs text-muted">{hint}</p>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  da_fare: 'status-muted',
  in_corso: 'status-progress',
  fatta: 'status-done',
  raggiunto: 'status-done',
  saltata: 'status-muted',
  in_ritardo: 'status-late',
};

export const STATUS_LABEL: Record<string, string> = {
  da_fare: 'Da fare',
  in_corso: 'In corso',
  fatta: 'Fatta',
  saltata: 'Saltata',
  raggiunto: 'Raggiunto',
  in_ritardo: 'In ritardo',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`pill ${STATUS_TONE[status] ?? 'status-muted'}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const inputClass =
  'w-full min-h-12 rounded-[10px] border border-border bg-surface-2 px-3 py-2 text-base text-text placeholder:text-muted';
