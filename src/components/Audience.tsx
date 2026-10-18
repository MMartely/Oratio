import type { ScenarioId } from '../types';

type Mood = 'attentive' | 'neutral' | 'distracted';

const SKINS = ['#F1C7A5', '#D9A47E', '#B57A55', '#8D5B3E', '#5E3B28', '#E8B48F'];
const HAIRS = ['#2B2230', '#5B3A2E', '#1F1A1A', '#8A4B2A', '#D8C3A5', '#3A2A20'];
const SHIRTS = ['#8B7FD1', '#E98E6B', '#5E8C6A', '#7FA8CF', '#E0B04F', '#C98BB9', '#6FA89A'];
const PARTY = ['#E98E6B', '#8B7FD1', '#E0B04F', '#6FA89A'];

/** Petit générateur pseudo-aléatoire : chaque spectateur garde la même apparence. */
function rng(seed: number) {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}

interface PersonProps {
  seed: number;
  x: number;
  y: number;
  scale: number;
  mood: Mood;
  clapping: boolean;
  hat?: boolean;
}

function Person({ seed, x, y, scale, mood, clapping, hat }: PersonProps) {
  const r = rng(seed);
  const skin = SKINS[Math.floor(r() * SKINS.length)];
  const hair = HAIRS[Math.floor(r() * HAIRS.length)];
  const shirt = SHIRTS[Math.floor(r() * SHIRTS.length)];
  const style = Math.floor(r() * 4);
  const tilt = mood === 'distracted' ? (r() > 0.5 ? 14 : -14) : 0;
  const ink = '#2E2A3B';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-22 40C-22 18-12 10 0 10S22 18 22 40Z" fill={shirt} />
      <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '0px 6px', transition: 'transform .6s ease' }}>
        {style === 1 && <path d="M-15-8C-17-30 17-30 15-8L16 10C8 15-8 15-16 10Z" fill={hair} />}
        <circle cy="-8" r="14" fill={skin} />
        {style === 0 && <path d="M-14-11C-14-26 14-26 14-11C9-17-9-17-14-11Z" fill={hair} />}
        {style === 1 && <path d="M-13-10C-12-24 12-25 13-11C7-18-6-19-13-10Z" fill={hair} />}
        {style === 2 && (
          <>
            <circle cy="-25" r="6" fill={hair} />
            <path d="M-14-10C-14-25 14-25 14-10C8-18-8-18-14-10Z" fill={hair} />
          </>
        )}
        {hat && <path d="M-7-19L0-38L7-19Z" fill={PARTY[seed % PARTY.length]} />}
        {mood === 'distracted' ? (
          <>
            <path d="M-7-7h4M3-7h4" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M-3 0h6" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="-5" cy="-9" r="1.7" fill={ink} />
            <circle cx="5" cy="-9" r="1.7" fill={ink} />
            <path
              d={mood === 'attentive' ? 'M-4-2Q0 2 4-2' : 'M-3-1h6'}
              fill="none"
              stroke={ink}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </>
        )}
      </g>
      {mood === 'distracted' && !clapping && <rect x="7" y="14" width="8" height="12" rx="2" fill={ink} opacity=".8" />}
      {clapping && (
        <g style={{ animation: 'clap .35s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx="-7" cy="6" r="5.5" fill={skin} stroke="#2E2A3B" strokeOpacity=".15" />
          <circle cx="7" cy="6" r="5.5" fill={skin} stroke="#2E2A3B" strokeOpacity=".15" />
        </g>
      )}
    </g>
  );
}

interface Seat {
  x: number;
  y: number;
  scale: number;
}

function rows(spec: [number, number, number][]): Seat[] {
  return spec.flatMap(([count, y, scale]) =>
    Array.from({ length: count }, (_, i) => ({ x: (360 / (count + 1)) * (i + 1), y, scale })),
  );
}

const LAYOUTS: Record<Exclude<ScenarioId, 'interview'>, Seat[]> = {
  talk: rows([
    [6, 62, 0.68],
    [5, 112, 0.84],
    [4, 168, 1],
  ]),
  event: rows([
    [6, 70, 0.68],
    [5, 120, 0.84],
    [4, 176, 1],
  ]),
  pitch: [
    { x: 90, y: 112, scale: 1.25 },
    { x: 180, y: 106, scale: 1.25 },
    { x: 270, y: 112, scale: 1.25 },
  ],
};

/**
 * Public virtuel qui réagit en direct : chaque spectateur a son propre seuil d'attention,
 * si bien que l'attention décroît (et revient) progressivement dans la salle.
 */
export function Audience({ variant, attention, applause }: { variant: Exclude<ScenarioId, 'interview'>; attention: number; applause: boolean }) {
  const seats = LAYOUTS[variant];
  return (
    <svg viewBox="0 0 360 220" className="w-full" role="img" aria-hidden>
      {variant === 'event' && (
        <g>
          <path d="M0 8Q180 46 360 8" fill="none" stroke="rgb(var(--muted))" strokeOpacity=".4" strokeWidth="1.5" />
          {Array.from({ length: 11 }, (_, i) => {
            const x = 16 + i * 33;
            const y = 8 + 38 * Math.sin((Math.PI * x) / 360) * 0.95;
            return <path key={i} d={`M${x - 8} ${y}L${x + 8} ${y}L${x} ${y + 14}Z`} fill={PARTY[i % PARTY.length]} opacity=".85" />;
          })}
        </g>
      )}
      {variant !== 'pitch' &&
        seats.map((s, i) => (
          <rect key={`seat-${i}`} x={s.x - 26 * s.scale} y={s.y + 4 * s.scale} width={52 * s.scale} height={40 * s.scale} rx={10 * s.scale} fill="rgb(var(--soft))" />
        ))}
      {seats.map((s, i) => {
        const threshold = 0.2 + rng(i * 7919 + 13)() * 0.6;
        const mood: Mood = attention >= threshold + 0.1 ? 'attentive' : attention >= threshold - 0.12 ? 'neutral' : 'distracted';
        return (
          <Person
            key={i}
            seed={i * 31 + (variant === 'pitch' ? 101 : variant === 'event' ? 57 : 3)}
            x={s.x}
            y={s.y}
            scale={s.scale}
            mood={applause ? 'attentive' : mood}
            clapping={applause}
            hat={variant === 'event' && i % 3 === 0}
          />
        );
      })}
      {variant === 'pitch' && (
        <g>
          <rect x="20" y="150" width="320" height="56" rx="10" fill="rgb(var(--soft))" />
          {[90, 180, 270].map((x) => (
            <rect key={x} x={x - 22} y="160" width="44" height="14" rx="3" fill="rgb(var(--surface))" />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Message et jauge d'attention sous le public. */
export function attentionMood(attention: number): Mood {
  return attention >= 0.7 ? 'attentive' : attention >= 0.4 ? 'neutral' : 'distracted';
}
