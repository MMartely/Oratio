import type { Coach } from '../data/coaches';

interface Props {
  coach: Coach;
  size?: number;
  className?: string;
}

/** Portrait stylisé et dessiné en SVG, sans image externe. */
export function CoachAvatar({ coach, size = 64, className = '' }: Props) {
  const { bg, skin, hair, top, style, beard, glasses } = coach.look;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 rounded-full ${className}`}
      role="img"
      aria-label={coach.name}
    >
      <circle cx="60" cy="60" r="60" fill={bg} />
      {style === 'long' && (
        <path d="M34 52C30 22 90 22 86 52L89 92C78 100 42 100 31 92Z" fill={hair} />
      )}
      <path d="M20 122C20 98 38 86 60 86S100 98 100 122Z" fill={top} />
      <path d="M50 84C54 90 66 90 70 84" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
      <rect x="52" y="68" width="16" height="18" rx="6" fill={skin} />
      <ellipse cx="60" cy="52" rx="22" ry="25" fill={skin} />
      {style === 'long' && <path d="M37 50C38 27 82 25 83 48C72 37 52 33 37 50Z" fill={hair} />}
      {style === 'short' && <path d="M36 49C33 20 87 20 84 49C80 42 72 39 60 39S40 42 36 49Z" fill={hair} />}
      {style === 'bun' && (
        <>
          <circle cx="60" cy="23" r="11" fill={hair} />
          <path d="M36 51C34 23 86 23 84 51C78 42 70 39 60 40C50 40 41 44 36 51Z" fill={hair} />
        </>
      )}
      {beard && (
        <path d="M39 55C40 80 80 80 81 55C79 66 72 70 60 70S41 66 39 55Z" fill={hair} opacity=".9" />
      )}
      <circle cx="51" cy="54" r="2.6" fill="#2E2A3B" />
      <circle cx="69" cy="54" r="2.6" fill="#2E2A3B" />
      <circle cx="45.5" cy="62" r="4" fill="#F4A08A" opacity=".45" />
      <circle cx="74.5" cy="62" r="4" fill="#F4A08A" opacity=".45" />
      <path
        d="M53 64Q60 70 67 64"
        fill="none"
        stroke={beard ? '#F6E7DD' : '#2E2A3B'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {glasses && (
        <g fill="none" stroke="#2E2A3B" strokeWidth="1.8">
          <circle cx="51" cy="54" r="6.5" />
          <circle cx="69" cy="54" r="6.5" />
          <path d="M57.5 54H62.5" />
        </g>
      )}
    </svg>
  );
}
