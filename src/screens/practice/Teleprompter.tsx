import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Mic, Pencil, RotateCcw, Square, X } from 'lucide-react';
import { CaptureFailure, type CaptureError } from '../../audio/capture';
import { useLiveRecorder } from '../../audio/useLiveRecorder';
import { CoachBubble } from '../../components/CoachBubble';
import { ChoiceRow } from '../../components/form';
import { formatTime } from '../../components/LiveParts';
import { SosButton } from '../../components/SosTrac';
import { BackButton, Button, Card, Pill, Screen } from '../../components/ui';
import { getCoach } from '../../data/coaches';
import { useI18n } from '../../i18n';
import { readJSON, writeJSON } from '../../services/safeStorage';
import { useApp } from '../../store/useApp';
import { follow, heardKeys, prepareScript } from '../../teleprompter/follow';

type Size = 'm' | 'l' | 'xl';
type Mode = 'voice' | 'pace';
interface Prefs {
  text: string;
  size: Size;
  wpm: number;
}

const PREFS_KEY = 'oratio.prompter';
const SIZES: Record<Size, string> = { m: 'text-2xl', l: 'text-3xl', xl: 'text-4xl' };
const MIN_WORDS = 10;
/** Silence au-delà duquel le défilement « suit ta voix » s'arrête. */
const PAUSE_STOP = 0.6;

/** Prompteur : le texte avance avec la lecture à voix haute et s'arrête quand on s'arrête. */
export function Teleprompter() {
  const { d, f, lang } = useI18n();
  const coach = getCoach(useApp((s) => s.data?.onboarding.coachId));
  const recordActivity = useApp((s) => s.recordActivity);
  const live = useLiveRecorder(lang, {
    filler: (word) => f(d.analysis.signals.filler, { word }),
    fast: d.analysis.signals.fast,
    quiet: d.analysis.signals.quiet,
  });

  const [prefs, setPrefs] = useState<Prefs>(() => ({ text: '', size: 'l', wpm: 130, ...readJSON<Partial<Prefs>>(PREFS_KEY, {}) }));
  const [phase, setPhase] = useState<'edit' | 'reading' | 'done'>('edit');
  const [mode, setMode] = useState<Mode>('voice');
  const [pos, setPos] = useState(0);
  const [problem, setProblem] = useState<CaptureError | 'empty' | null>(null);
  const [summary, setSummary] = useState<{ seconds: number; words: number; wpm: number | null } | null>(null);
  const script = useMemo(() => prepareScript(prefs.text), [prefs.text]);
  const posRef = useRef(0);
  /** Mots réellement lus : les sauts à la main ne comptent pas dans le débit. */
  const readCount = useRef(0);
  const paceAcc = useRef(0);
  const heardFrom = useRef(0);
  const finishing = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<Prefs>) =>
    setPrefs((p) => {
      const next = { ...p, ...patch };
      writeJSON(PREFS_KEY, next);
      return next;
    });

  const moveTo = useCallback((next: number, read = true) => {
    if (read && next > posRef.current) readCount.current += next - posRef.current;
    posRef.current = next;
    setPos(next);
  }, []);

  const start = async () => {
    setProblem(null);
    if (script.keys.length < MIN_WORDS) return setProblem('empty');
    try {
      await live.open();
    } catch (e) {
      return setProblem(e instanceof CaptureFailure ? e.code : 'unknown');
    }
    moveTo(0, false);
    readCount.current = 0;
    paceAcc.current = 0;
    heardFrom.current = 0;
    setMode(live.canTranscribe ? 'voice' : 'pace');
    live.begin();
    setPhase('reading');
  };

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    const segment = await live.end();
    await live.close();
    finishing.current = false;
    const words = readCount.current;
    const speaking = segment.acoustic.speakingTime;
    const seconds = Math.round(segment.acoustic.duration);
    recordActivity(Math.max(1, Math.round(seconds / 60)), 5 + 2 * Math.max(1, Math.round(seconds / 60)));
    setSummary({ seconds, words, wpm: speaking >= 5 && words >= 5 ? Math.round((words / speaking) * 60) : null });
    setPhase('done');
  }, [live, recordActivity]);

  // Mode « suit tes mots » : on cherche les derniers mots entendus dans le texte.
  const heard = `${live.state.finalText} ${live.state.interim}`;
  useEffect(() => {
    if (phase !== 'reading' || mode !== 'voice') return;
    const words = heardKeys(heard).slice(heardFrom.current);
    const next = follow(script.keys, posRef.current, words);
    if (next !== posRef.current) moveTo(next);
  }, [heard, phase, mode, script.keys, moveTo]);

  // Mode « suit ta voix » : le texte avance à la vitesse choisie tant que l'on parle.
  useEffect(() => {
    if (phase !== 'reading' || mode !== 'pace') return;
    const timer = window.setInterval(() => {
      const st = live.analyzer.current?.recentStats(1.5);
      if (!st || st.speakingRatio === 0 || st.silence > PAUSE_STOP) return;
      paceAcc.current += (prefs.wpm / 60) * 0.1;
      const next = Math.min(script.keys.length, Math.floor(paceAcc.current));
      if (next > posRef.current) moveTo(next);
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase, mode, prefs.wpm, script.keys.length, live.analyzer, moveTo]);

  // Fin du texte : on termine tout seul après un court instant.
  useEffect(() => {
    if (phase !== 'reading' || pos < script.keys.length) return;
    const timer = window.setTimeout(() => void finish(), 1500);
    return () => window.clearTimeout(timer);
  }, [phase, pos, script.keys.length, finish]);

  // Le mot en cours reste au premier tiers de l'écran.
  useEffect(() => {
    if (phase !== 'reading') return;
    const box = scroller.current;
    const word = box?.querySelector<HTMLElement>(`[data-i="${Math.min(pos, script.keys.length - 1)}"]`);
    if (!box || !word) return;
    box.scrollTo({ top: Math.max(0, word.offsetTop - box.clientHeight * 0.3), behavior: 'smooth' });
  }, [pos, phase, script.keys.length]);

  /** Reprendre à un mot touché : la voix est de nouveau suivie à partir de là. */
  const jump = (i: number) => {
    moveTo(i, false);
    paceAcc.current = i;
    heardFrom.current = heardKeys(heard).length;
  };

  const cancel = () => {
    live.cancel();
    setPhase('edit');
  };

  if (phase === 'reading') {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <button type="button" onClick={cancel} className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft" aria-label={d.analysis.cancel}>
            <X size={24} />
          </button>
          <p className="font-display text-xl font-semibold tabular-nums">{formatTime(live.state.elapsed)}</p>
          <div className="flex-1" />
          <div className="flex rounded-full bg-soft p-1 text-xs font-bold" role="group" aria-label={d.prompter.modeLabel}>
            {(['voice', 'pace'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                disabled={m === 'voice' && !live.canTranscribe}
                onClick={() => {
                  paceAcc.current = posRef.current;
                  heardFrom.current = heardKeys(heard).length;
                  setMode(m);
                }}
                className={`rounded-full px-3 py-1.5 transition disabled:opacity-40 ${mode === m ? 'bg-surface text-primary shadow-soft' : 'text-muted'}`}
              >
                {d.prompter.modes[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-3 flex-1 overflow-hidden rounded-3xl border border-line bg-surface">
          {/* Repère de lecture au premier tiers. */}
          <div className="pointer-events-none absolute inset-x-0 top-[30%] z-10 h-0.5 bg-primary/25" aria-hidden />
          <div ref={scroller} className="relative h-full overflow-y-auto px-5 pb-[70vh] pt-[28vh]">
            <p className={`${SIZES[prefs.size]} font-semibold leading-snug`}>
              {script.display.map((w, i) => (
                <span key={i}>
                  <span
                    data-i={i}
                    onClick={() => jump(i)}
                    className={`cursor-pointer rounded-md transition-colors ${i < pos ? 'text-muted/50' : i === pos ? 'bg-primary/15 text-ink' : 'text-ink'}`}
                  >
                    {w}
                  </span>{' '}
                </span>
              ))}
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted">{d.prompter.jumpHint}</p>
        <Button full className="mt-3" onClick={() => void finish()}>
          <Square size={18} fill="currentColor" /> {d.analysis.stop}
        </Button>
      </div>
    );
  }

  if (phase === 'done' && summary) {
    const pace = summary.wpm === null ? 'unknown' : summary.wpm < 110 ? 'slow' : summary.wpm > 165 ? 'fast' : 'ok';
    return (
      <Screen>
        <div className="flex flex-1 flex-col gap-5 animate-rise">
          <h1 className="mt-4 text-center text-3xl font-semibold">{d.prompter.doneTitle}</h1>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { v: formatTime(summary.seconds), l: d.prompter.readTime },
              { v: summary.words, l: d.prompter.readWords },
              { v: summary.wpm ?? '—', l: d.prompter.readPace },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-surface py-3 shadow-soft">
                <p className="font-display text-xl font-semibold tabular-nums">{x.v}</p>
                <p className="text-xs font-bold text-muted">{x.l}</p>
              </div>
            ))}
          </div>
          <CoachBubble coach={coach} message={d.prompter.paceTips[pace]} />
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setPhase('edit')}>
              <Pencil size={18} /> {d.prompter.edit}
            </Button>
            <Button onClick={() => void start()}>
              <RotateCcw size={18} /> {d.prompter.again}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const minutes = Math.max(1, Math.round(script.keys.length / prefs.wpm));
  const problemText = problem === 'empty' ? d.prompter.empty : problem ? d.analysis.micErrors[problem] : null;
  return (
    <Screen>
      <div className="flex items-center gap-2">
        <BackButton label={d.common.back} />
        <h1 className="flex-1 text-2xl font-semibold">{d.features.teleprompter.label}</h1>
        <SosButton />
      </div>
      <div className="mt-4 flex-1 space-y-5 animate-rise">
        <CoachBubble coach={coach} message={d.prompter.intro} />
        <section>
          <div className="mb-2 flex items-end justify-between gap-3">
            <label htmlFor="script" className="font-sans text-sm font-extrabold uppercase tracking-wider text-muted">
              {d.prompter.textLabel}
            </label>
            <button type="button" onClick={() => update({ text: d.prompter.sampleText })} className="text-sm font-bold text-primary">
              {d.prompter.sample}
            </button>
          </div>
          <textarea
            id="script"
            value={prefs.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder={d.prompter.placeholder}
            rows={8}
            maxLength={8000}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 leading-relaxed text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          />
          {script.keys.length > 0 && (
            <Pill className="mt-2 bg-soft text-muted">{f(d.prompter.stats, { n: script.keys.length, time: f(d.common.minutes, { n: minutes }) })}</Pill>
          )}
        </section>
        <ChoiceRow
          label={d.prompter.size}
          value={prefs.size}
          onChange={(v) => update({ size: v })}
          options={(['m', 'l', 'xl'] as const).map((v) => ({ value: v, label: d.prompter.sizes[v] }))}
        />
        <Card>
          <label htmlFor="wpm" className="flex items-center justify-between font-bold">
            {d.prompter.speed}
            <span className="text-primary tabular-nums">{f(d.prompter.wpm, { n: prefs.wpm })}</span>
          </label>
          <input
            id="wpm"
            type="range"
            min={90}
            max={180}
            step={10}
            value={prefs.wpm}
            onChange={(e) => update({ wpm: Number(e.target.value) })}
            className="mt-3 w-full accent-[rgb(var(--primary))]"
          />
          <p className="mt-1 text-sm text-muted">{d.prompter.speedHint}</p>
        </Card>
        {problemText && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-peach/20 px-4 py-3 text-sm font-semibold">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {problemText}
          </p>
        )}
      </div>
      <Button full className="mt-6" onClick={() => void start()}>
        <Mic size={20} /> {d.prompter.start}
      </Button>
    </Screen>
  );
}
