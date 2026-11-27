import { hours as fmtHours } from './format';

interface Props {
  data: { n: number; hours: number }[];
  target: number;
  current: number;
}

/** Hand-made SVG bar chart: teal bars, dashed amber target line, mono labels. */
export default function WeeklyChart({ data, target, current }: Props) {
  const width = 360;
  const height = 180;
  const pad = { top: 16, right: 8, bottom: 24, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(target * 1.15, ...data.map((d) => d.hours), 1);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const slot = innerW / Math.max(data.length, 1);
  const barW = Math.max(6, slot * 0.62);
  const summary = data.map((d) => `settimana ${d.n}: ${fmtHours(d.hours)} ore`).join(', ');

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Ore per settimana. Obiettivo ${target} ore. ${summary}`}>
        {[0, Math.round(max / 2), Math.round(max)].map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.left - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)" fontFamily="var(--font-mono)">
              {v}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          const h = Math.max(0, pad.top + innerH - y(d.hours));
          return (
            <g key={d.n}>
              <rect
                x={x}
                y={pad.top + innerH - h}
                width={barW}
                height={h}
                rx={3}
                fill="var(--accent-2)"
                opacity={d.n === current ? 1 : 0.75}
              >
                <title>{`Settimana ${d.n}: ${fmtHours(d.hours)} h`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={10}
                fill={d.n === current ? 'var(--text)' : 'var(--text-muted)'}
                fontFamily="var(--font-mono)"
              >
                {d.n}
              </text>
            </g>
          );
        })}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={y(target)}
          y2={y(target)}
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text x={width - pad.right} y={y(target) - 5} textAnchor="end" fontSize={10} fill="var(--accent)" fontFamily="var(--font-mono)">
          obiettivo {target} h
        </text>
      </svg>
    </figure>
  );
}
