import { Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCoach } from '../data/coaches';
import { CoachBubble } from '../components/CoachBubble';
import { BackButton, Button, Screen } from '../components/ui';
import { useI18n } from '../i18n';
import { useApp } from '../store/useApp';

export function Soon() {
  const { d } = useI18n();
  const navigate = useNavigate();
  const coach = getCoach(useApp((s) => s.data?.onboarding.coachId));
  return (
    <Screen>
      <BackButton label={d.common.back} />
      <div className="flex flex-1 flex-col items-center justify-center text-center animate-rise">
        <span className="grid size-20 place-items-center rounded-3xl bg-sun/30 text-[#9A6B12] dark:text-sun">
          <Hammer size={36} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">{d.soon.title}</h1>
        <div className="mt-6 w-full text-left">
          <CoachBubble coach={coach} message={d.soon.body} />
        </div>
      </div>
      <Button full variant="secondary" onClick={() => navigate(-1)}>
        {d.common.back}
      </Button>
    </Screen>
  );
}
