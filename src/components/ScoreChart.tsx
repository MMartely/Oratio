import { useState } from 'react';
import type { AnalysisResult } from '../types';

const W = 320;
const H = 150;
const PAD = { top: 18, right: 18, bottom: 22, left: 28 };

/** Évolution du score global sur les dernières analyses (une seule série, de 0 à 100). */
export function ScoreChart({ sessions, lang, label }: { sessions: AnalysisResult[]; lang: string; label: string }) {
  const points = [...sessions].reverse();
  const [active, setActive] = useState<number | null>(null);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + (1 - v / 100) * innerH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.scores.global)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const last = points.length - 1;
  const shown = active ?? last;
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label} onMouseLeave={() => setActive(null)}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="stroke-line" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {v}
            </text>
          </g>
        ))}
        {points.length > 1 && <path d={area} className="fill-chart/10" />}
        {points.length > 1 && <path d={line} fill="none" className="stroke-chart" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className="stroke-muted/40" strokeDasharray="3 3" />}
        {points.map((p, i) => (
          <circle key={p.id} cx={x(i)} cy={y(p.scores.global)} r={i === shown ? 6 : 4} className="fill-chart stroke-surface" strokeWidth="2" />
        ))}
        {points.map((p, i) => (
          <circle
            key={`hit-${p.id}`}
            cx={x(i)}
            cy={y(p.scores.global)}
            r="16"
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${date(p.createdAt)} : ${p.scores.global}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(i)}
            className="cursor-pointer outline-none"
          />
        ))}
        <text x={PAD.left} y={H - 4} className="fill-muted text-[10px]">
          {date(points[0].createdAt)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 4} textAnchor="end" className="fill-muted text-[10px]">
            {date(points[last].createdAt)}
          </text>
        )}
      </svg>
      <div
        className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-xl border border-line bg-surface px-2.5 py-1 text-center shadow-soft"
        style={{
          left: `${Math.min(88, Math.max(12, (x(shown) / W) * 100))}%`,
          // Au-dessus du point, sauf pour les scores élevés où l'infobulle sortirait du cadre.
          top: `calc(${(y(points[shown].scores.global) / H) * 100}% ${points[shown].scores.global < 75 ? '- 50px' : '+ 12px'})`,
        }}
      >
        <p className="font-display text-base font-semibold leading-tight tabular-nums">{points[shown].scores.global}</p>
        <p className="text-[10px] text-muted">{date(points[shown].createdAt)}</p>
      </div>
    </div>
  );
}
