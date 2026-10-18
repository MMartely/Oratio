import { Star } from 'lucide-react';

/** Étoiles gagnées (sur 3). */
export function Stars({ count, size = 20, animate = false }: { count: number; size?: number; animate?: boolean }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${count}/3`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          className={`${i <= count ? 'fill-sun text-[#C8961E]' : 'text-line'} ${animate && i <= count ? 'animate-rise' : ''}`}
          style={animate ? { animationDelay: `${i * 180}ms` } : undefined}
        />
      ))}
    </span>
  );
}
