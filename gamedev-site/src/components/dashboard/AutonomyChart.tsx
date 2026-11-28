import type { JournalEntry } from '../../lib/types';
import { shortDate } from './format';

/** Hand-made SVG line of the autonomy score (1–5) over the latest journal entries. */
export default function AutonomyChart({ entries }: { entries: JournalEntry[] }) {
  const points = entries
    .filter((e) => e.autonomy !== null)
    .slice(0, 30)
    .reverse();
  if (points.length < 2) {
    return <p className="text-sm text-muted">Il grafico compare dopo almeno due giorni con il voto di autonomia.</p>;
  }
  const width = 360;
  const height = 140;
  const pad = { top: 12, right: 10, bottom: 22, left: 22 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - ((v - 1) / 4) * innerH;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.autonomy ?? 1).toFixed(1)}`).join(' ');
  const avg = points.reduce((s, p) => s + (p.autonomy ?? 0), 0) / points.length;
  const first = points[0];
  const last = points.at(-1);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Autonomia negli ultimi ${points.length} giorni, media ${avg.toFixed(1)} su 5`}
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.left - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)" fontFamily="var(--font-mono)">
              {v}
            </text>
          </g>
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={y(avg)} y2={y(avg)} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={path} fill="none" stroke="var(--accent-2)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.autonomy ?? 1)} r={3} fill="var(--accent-2)">
            <title>{`${shortDate(p.date)}: ${p.autonomy}/5`}</title>
          </circle>
        ))}
        {first && (
          <text x={pad.left} y={height - 6} fontSize={10} fill="var(--text-muted)" fontFamily="var(--font-mono)">
            {shortDate(first.date)}
          </text>
        )}
        {last && (
          <text x={width - pad.right} y={height - 6} textAnchor="end" fontSize={10} fill="var(--text-muted)" fontFamily="var(--font-mono)">
            {shortDate(last.date)}
          </text>
        )}
      </svg>
      <figcaption className="mt-1 font-mono text-xs text-muted">media {avg.toFixed(1)} / 5 (linea ambra)</figcaption>
    </figure>
  );
}
