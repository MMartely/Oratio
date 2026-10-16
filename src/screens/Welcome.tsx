import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { coaches } from '../data/coaches';
import { CoachAvatar } from '../components/CoachAvatar';
import { Button, Screen } from '../components/ui';
import { LangSwitch } from '../components/LangSwitch';
import { useI18n } from '../i18n';

export function Welcome() {
  const { d } = useI18n();
  const navigate = useNavigate();
  return (
    <Screen>
      <div className="flex justify-end">
        <LangSwitch />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-8 h-36 w-56 animate-rise">
          <div className="absolute inset-0 m-auto size-36 animate-breathe rounded-full bg-primary/10" />
          <CoachAvatar coach={coaches[1]} size={76} className="absolute left-0 top-10 ring-4 ring-bg" />
          <CoachAvatar coach={coaches[2]} size={76} className="absolute right-0 top-10 ring-4 ring-bg" />
          <CoachAvatar coach={coaches[0]} size={96} className="absolute inset-x-0 top-2 mx-auto ring-4 ring-bg" />
        </div>
        <h1 className="animate-rise text-5xl font-semibold text-primary">Oratio</h1>
        <p className="mt-2 animate-rise font-display text-2xl">{d.welcome.tagline}</p>
        <p className="mt-4 max-w-sm animate-rise text-muted">{d.welcome.pitch}</p>
        <ul className="mt-6 w-full max-w-sm space-y-2.5 text-left">
          {d.welcome.features.map((item, i) => (
            <li key={item} className="flex animate-rise items-start gap-3" style={{ animationDelay: `${120 + i * 80}ms` }}>
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage/30 text-[#3F7350] dark:text-sage">
                <Check size={14} strokeWidth={3} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 space-y-2">
        <Button full onClick={() => navigate('/onboarding')}>
          {d.welcome.cta}
        </Button>
        <Button full variant="ghost" onClick={() => navigate('/signin')}>
          {d.welcome.haveAccount}
        </Button>
      </div>
    </Screen>
  );
}
