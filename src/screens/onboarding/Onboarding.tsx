import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronLeft,
  CloudLightning,
  CloudRain,
  CloudSun,
  GraduationCap,
  HeartHandshake,
  PartyPopper,
  Rocket,
  Sun,
  Timer,
} from 'lucide-react';
import { coaches } from '../../data/coaches';
import { CoachAvatar } from '../../components/CoachAvatar';
import { BackButton, Button, ChoiceCard, ProgressBar, Screen } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useApp } from '../../store/useApp';
import type { Anxiety, DailyMinutes, GoalId } from '../../types';

const goalIcons: Record<GoalId, JSX.Element> = {
  confidence: <HeartHandshake size={22} />,
  studies: <GraduationCap size={22} />,
  work: <Briefcase size={22} />,
  pitch: <Rocket size={22} />,
  events: <PartyPopper size={22} />,
};

const anxietyIcons: Record<Anxiety, JSX.Element> = {
  '1': <CloudLightning size={22} />,
  '2': <CloudRain size={22} />,
  '3': <CloudSun size={22} />,
  '4': <Sun size={22} />,
};

const STEPS = ['goals', 'anxiety', 'time', 'coach'] as const;

export function Onboarding() {
  const { d, f } = useI18n();
  const navigate = useNavigate();
  const draft = useApp((s) => s.draft);
  const updateDraft = useApp((s) => s.updateDraft);
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const canContinue =
    (current === 'goals' && draft.goals.length > 0) ||
    (current === 'anxiety' && draft.anxiety !== null) ||
    current === 'time' ||
    (current === 'coach' && draft.coachId !== null);

  const next = () => {
    if (step < STEPS.length - 1) return setStep(step + 1);
    updateDraft({ done: true });
    navigate('/signup');
  };

  const toggleGoal = (goal: GoalId) =>
    updateDraft({
      goals: draft.goals.includes(goal) ? draft.goals.filter((g) => g !== goal) : [...draft.goals, goal],
    });

  const titles = {
    goals: d.onboarding.goals,
    anxiety: d.onboarding.anxiety,
    time: d.onboarding.time,
    coach: d.onboarding.coach,
  }[current];

  return (
    <Screen>
      <div className="flex items-center gap-3">
        {step === 0 ? (
          <BackButton to="/welcome" label={d.common.back} />
        ) : (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-soft"
            aria-label={d.common.back}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <ProgressBar value={(step + 1) / STEPS.length} className="flex-1" />
      </div>

      <div key={current} className="mt-6 flex-1 animate-rise">
        <p className="text-sm font-bold text-muted">{f(d.onboarding.step, { n: step + 1, total: STEPS.length })}</p>
        <h1 className="mt-1 text-3xl font-semibold">{titles.title}</h1>
        <p className="mt-1 text-muted">{titles.subtitle}</p>

        <div className="mt-6 space-y-3">
          {current === 'goals' &&
            (Object.keys(d.onboarding.goals.options) as GoalId[]).map((id) => (
              <ChoiceCard
                key={id}
                selected={draft.goals.includes(id)}
                onClick={() => toggleGoal(id)}
                icon={goalIcons[id]}
                label={d.onboarding.goals.options[id].label}
                hint={d.onboarding.goals.options[id].hint}
              />
            ))}

          {current === 'anxiety' &&
            (Object.keys(d.onboarding.anxiety.options) as Anxiety[]).map((id) => (
              <ChoiceCard
                key={id}
                selected={draft.anxiety === id}
                onClick={() => updateDraft({ anxiety: id })}
                icon={anxietyIcons[id]}
                label={d.onboarding.anxiety.options[id].label}
                hint={d.onboarding.anxiety.options[id].hint}
              />
            ))}

          {current === 'time' &&
            (Object.keys(d.onboarding.time.options) as DailyMinutes[]).map((id) => (
              <ChoiceCard
                key={id}
                selected={draft.dailyMinutes === id}
                onClick={() => updateDraft({ dailyMinutes: id })}
                icon={<Timer size={22} />}
                label={d.onboarding.time.options[id].label}
                hint={d.onboarding.time.options[id].hint}
              />
            ))}

          {current === 'coach' &&
            coaches.map((coach) => {
              const selected = draft.coachId === coach.id;
              const text = d.coaches[coach.id];
              return (
                <button
                  key={coach.id}
                  type="button"
                  onClick={() => updateDraft({ coachId: coach.id })}
                  aria-pressed={selected}
                  className={`w-full rounded-3xl border-2 p-4 text-left transition active:scale-[.99] ${
                    selected ? 'border-primary bg-primary/10' : 'border-line bg-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <CoachAvatar coach={coach} size={72} />
                    <div className="min-w-0">
                      <p className="font-display text-xl font-semibold">{coach.name}</p>
                      <p className="text-sm font-bold text-primary">{text.role}</p>
                      <p className="mt-0.5 text-sm text-muted">{text.pitch}</p>
                    </div>
                  </div>
                  {selected && (
                    <p className="mt-3 animate-rise rounded-2xl bg-surface p-3 text-sm italic leading-snug">“{text.intro}”</p>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-bg via-bg pt-4">
        <Button full onClick={next} disabled={!canContinue}>
          {current === 'coach' && draft.coachId
            ? f(d.onboarding.coach.choose, { name: coaches.find((c) => c.id === draft.coachId)!.name })
            : d.common.continue}
        </Button>
      </div>
    </Screen>
  );
}
