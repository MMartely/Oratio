import { Check, Crown } from 'lucide-react';
import { BackButton, Button, Screen } from '../components/ui';
import { useI18n } from '../i18n';
import { backend } from '../services/backend';
import { useApp } from '../store/useApp';

export function Premium() {
  const { d } = useI18n();
  const plan = useApp((s) => s.data?.plan);
  const setDemoPlan = useApp((s) => s.setDemoPlan);
  return (
    <Screen>
      <BackButton label={d.common.back} />
      <div className="flex flex-1 flex-col items-center pt-4 text-center animate-rise">
        <span className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-[#B59BE8] text-white shadow-soft">
          <Crown size={36} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">{d.premium.title}</h1>
        <p className="mt-1 text-muted">{d.premium.subtitle}</p>
        <ul className="mt-8 w-full space-y-3 text-left">
          {d.premium.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage/30 text-[#3F7350] dark:text-sage">
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="font-semibold">{perk}</span>
            </li>
          ))}
        </ul>
      </div>
      {backend.mode === 'demo' ? (
        <div className="mt-8 space-y-2">
          {plan === 'premium' && <p className="text-center text-sm font-semibold text-muted">{d.premium.demoActive}</p>}
          <Button full variant={plan === 'premium' ? 'secondary' : 'primary'} onClick={() => setDemoPlan(plan === 'premium' ? 'free' : 'premium')}>
            {plan === 'premium' ? d.premium.demoOff : d.premium.demoOn}
          </Button>
        </div>
      ) : (
        <Button full disabled className="mt-8">
          {d.premium.cta}
        </Button>
      )}
    </Screen>
  );
}
