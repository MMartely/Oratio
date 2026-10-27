import { Check, Circle } from 'lucide-react';
import { Card } from '../../components/ui';
import { statusOf } from '../../analysis/metrics';
import { useI18n } from '../../i18n';
import type { AnalysisResult } from '../../types';

const tone = {
  good: 'bg-sage/25 text-[#3F7350] dark:text-sage',
  ok: 'bg-sun/30 text-[#8A5E0C] dark:text-sun',
  work: 'bg-peach/25 text-[#9A4B2E] dark:text-peach',
} as const;

const LIGHT_DOT = { none: 'bg-line', green: 'bg-[#3F8F5A]', orange: 'bg-[#E39B2D]', red: 'bg-[#C9483B]', over: 'bg-[#7E2B22]' } as const;
const seconds = (s: number) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`);

/** Partie du bilan propre aux situations : public, temps, incontournables, réponses d'entretien. */
export function ScenarioSection({ result }: { result: AnalysisResult }) {
  const { d, f } = useI18n();
  const s = result.scenario;
  if (!s) return null;
  const items = d.results.checklistItems as Record<string, string>;

  return (
    <>
      {(s.attention !== undefined || s.timing || s.lights) && (
        <div className="grid grid-cols-2 gap-3">
          {s.attention !== undefined && (
            <div className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm font-bold text-muted">{d.results.attention}</p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums">{s.attention} %</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: `${s.attention}%` }} />
              </div>
            </div>
          )}
          {s.timing && !s.lights && (
            <div className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm font-bold text-muted">{d.results.timing}</p>
              <p className="mt-1 font-display text-xl font-semibold">{d.results.timingLevels[s.timing]}</p>
              <p className="mt-0.5 text-xs text-muted">{f(d.results.target, { n: Math.round(s.targetSeconds / 60) })}</p>
            </div>
          )}
          {s.lights && s.lightTimes && (
            <div className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm font-bold text-muted">{d.results.lights}</p>
              <p className="mt-1 flex items-center gap-2 font-display text-xl font-semibold">
                <span className={`size-4 shrink-0 rounded-full ${LIGHT_DOT[s.lights]}`} />
                {d.results.lightLevels[s.lights]}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {f(d.results.lightRange, { green: seconds(s.lightTimes.green), red: seconds(s.lightTimes.red) })}
              </p>
            </div>
          )}
        </div>
      )}

      {s.checklist && s.checklist.length > 0 && (
        <Card>
          <h3 className="font-sans font-bold">{d.results.checklist}</h3>
          <ul className="mt-3 space-y-2">
            {s.checklist.map((c) => (
              <li key={c.key} className={`flex items-center gap-2.5 ${c.done ? '' : 'text-muted'}`}>
                {c.done ? (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sage/30 text-[#3F7350] dark:text-sage">
                    <Check size={14} strokeWidth={3} />
                  </span>
                ) : (
                  <Circle size={24} className="shrink-0 text-line" />
                )}
                {items[c.key] ?? c.key}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {s.answers && s.answers.length > 0 && (
        <Card>
          <h3 className="font-sans font-bold">{d.results.answers}</h3>
          <ol className="mt-3 space-y-4">
            {s.answers.map((a, i) => (
              <li key={i} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <p className="flex-1 font-semibold leading-snug">
                    {a.followUp && (
                      <span className="mr-1.5 rounded-full bg-sun/30 px-2 py-0.5 text-xs font-bold text-[#8A5E0C] dark:text-sun">{d.results.followUpTag}</span>
                    )}
                    {a.question}
                  </p>
                  {a.score !== null && (
                    <span className={`rounded-full px-2.5 py-1 text-sm font-extrabold tabular-nums ${tone[statusOf(a.score)]}`}>{a.score}</span>
                  )}
                </div>
                {a.transcript && <p className="line-clamp-3 rounded-2xl bg-soft px-3 py-2 text-sm text-muted">« {a.transcript} »</p>}
                {a.feedback && <p className="text-sm">{a.feedback}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
