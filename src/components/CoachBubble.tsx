import type { Coach } from '../data/coaches';
import { CoachAvatar } from './CoachAvatar';

export function CoachBubble({ coach, message, size = 56 }: { coach: Coach; message: string; size?: number }) {
  return (
    <div className="flex items-end gap-3">
      <CoachAvatar coach={coach} size={size} />
      <div className="relative flex-1 rounded-3xl rounded-bl-md border border-line bg-surface px-4 py-3 shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-wider text-primary">{coach.name}</p>
        <p className="mt-0.5 leading-snug">{message}</p>
      </div>
    </div>
  );
}
