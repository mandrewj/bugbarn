"use client";

import type { Range } from "@/lib/types";
import { fmtDate } from "@/lib/format";

export interface TrendPoint {
  date: string; // ISO timestamp
  value: number;
}

const W = 720;
const H = 210;
const PAD = { l: 40, r: 16, t: 16, b: 28 };

/** Lightweight, dependency-free SVG line chart for a single reading series,
 * with an optional shaded target band. Scales to its container width. */
export function TrendChart({
  title,
  unit,
  color,
  points,
  target,
}: {
  title: string;
  unit: string;
  color: string;
  points: TrendPoint[];
  target: Range | null;
}) {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  if (points.length === 0) {
    return (
      <div className="trendcard">
        <div className="trend-h">
          <b>{title}</b>
        </div>
        <div className="trend-empty">No readings in this range yet.</div>
      </div>
    );
  }

  const times = points.map((p) => new Date(p.date).getTime());
  const t0 = times[0];
  const t1 = times[times.length - 1];
  const vals = points.map((p) => p.value);

  // y-domain spans the data and the target band, with a little headroom.
  let lo = Math.min(...vals, target ? target.min : Infinity);
  let hi = Math.max(...vals, target ? target.max : -Infinity);
  if (!isFinite(lo) || !isFinite(hi)) {
    lo = Math.min(...vals);
    hi = Math.max(...vals);
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const padY = (hi - lo) * 0.12;
  lo -= padY;
  hi += padY;

  const x = (ms: number) => (t1 === t0 ? PAD.l + innerW / 2 : PAD.l + ((ms - t0) / (t1 - t0)) * innerW);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * innerH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  const bandTop = target ? y(target.max) : 0;
  const bandH = target ? y(target.min) - y(target.max) : 0;

  return (
    <div className="trendcard">
      <div className="trend-h">
        <b>{title}</b>
        <span className="trend-last" style={{ color }}>
          {last.value}
          {unit}
          <small> latest</small>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="trendsvg" role="img" aria-label={`${title} over time`}>
        {/* target band */}
        {target ? (
          <>
            <rect x={PAD.l} y={bandTop} width={innerW} height={bandH} fill={color} opacity={0.1} />
            <line x1={PAD.l} x2={W - PAD.r} y1={y(target.max)} y2={y(target.max)} stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
            <line x1={PAD.l} x2={W - PAD.r} y1={y(target.min)} y2={y(target.min)} stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
          </>
        ) : null}

        {/* y axis labels (hi / lo) */}
        <text x={PAD.l - 6} y={y(hi) + 4} textAnchor="end" className="trend-axis">
          {Math.round(hi)}
        </text>
        <text x={PAD.l - 6} y={y(lo) + 4} textAnchor="end" className="trend-axis">
          {Math.round(lo)}
        </text>

        {/* baseline */}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#E3D7BD" strokeWidth={1} />

        {/* series */}
        <path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(times[i])} cy={y(p.value)} r={points.length > 40 ? 1.6 : 2.8} fill={color} />
        ))}

        {/* x axis labels (first / last) */}
        <text x={PAD.l} y={H - 8} textAnchor="start" className="trend-axis">
          {fmtDate(points[0].date, { month: "short", day: "numeric" })}
        </text>
        {points.length > 1 ? (
          <text x={W - PAD.r} y={H - 8} textAnchor="end" className="trend-axis">
            {fmtDate(last.date, { month: "short", day: "numeric" })}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
