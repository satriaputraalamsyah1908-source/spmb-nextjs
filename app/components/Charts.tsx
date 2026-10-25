// Grafik sederhana berbasis SVG (tanpa library tambahan).

export type Seg = { label: string; value: number; color: string };

/* ---------- Donut ---------- */
export function Donut({
  segments,
  center,
  caption,
  size = 190,
}: {
  segments: Seg[];
  center: string | number;
  caption: string;
  size?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut">
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`Diagram: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
      >
        <g transform="rotate(-90 100 100)">
          {segments.map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="28"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="100" y="106" textAnchor="middle" fontSize="42" fill="#111">
          {center}
        </text>
        <text x="100" y="128" textAnchor="middle" fontSize="14" fill="#111">
          {caption}
        </text>
      </svg>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Bar ---------- */
export function Bars({ data, height = 170 }: { data: Seg[]; height?: number }) {
  const W = 420;
  const top = 10;
  const max = Math.max(...data.map((d) => d.value), 1);
  const plotH = height - top;
  const slot = W / data.length;
  const bw = 62;

  return (
    <svg viewBox={`0 0 ${W} ${height + 30}`} width="100%" role="img" aria-label="Grafik batang status pendaftar">
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="0"
          x2={W}
          y1={top + (plotH / 7) * i}
          y2={top + (plotH / 7) * i}
          stroke="#fff"
          strokeOpacity="0.55"
        />
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * (plotH - 6);
        const x = slot * i + (slot - bw) / 2;
        return (
          <g key={d.label}>
            <rect x={x} y={top + plotH - h} width={bw} height={h} fill={d.color}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text x={slot * i + slot / 2} y={height + 20} textAnchor="middle" fontSize="12" fill="#111">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Line ---------- */
export function LineChart({ points, max = 100 }: { points: { label: string; value: number }[]; max?: number }) {
  const W = 700;
  const H = 320;
  const L = 52;
  const R = 24;
  const T = 20;
  const B = 44;
  const n = points.length;
  const x = (i: number) => L + (i * (W - L - R)) / (n - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 1, 2, 3, 4, 5].map((k) => Math.round((max / 5) * k * 10) / 10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Grafik jumlah pendaftar per hari">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#111" strokeWidth="2.5" />
          <text x={L - 12} y={y(v) + 5} textAnchor="end" fontSize="16" fill="#111">
            {v}
          </text>
        </g>
      ))}
      <polyline
        fill="none"
        stroke="#0a4a0a"
        strokeWidth="4"
        strokeLinejoin="round"
        points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
      />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r="10" fill="#0a4a0a">
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
          <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="16" fill="#111">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
