import { useNavigate } from 'react-router-dom';
import { SosSession } from '../../components/SosTrac';
import { BackButton, Screen } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Écran « SOS trac », accessible à tous depuis l'accueil et l'onglet S'entraîner. */
export function Breathing() {
  const { d } = useI18n();
  const navigate = useNavigate();
  return (
    <Screen>
      <div className="mb-4 flex items-center gap-2">
        <BackButton label={d.common.back} />
        <h1 className="text-2xl font-semibold">{d.features.breathing.label}</h1>
      </div>
      <SosSession onDone={() => navigate(-1)} />
    </Screen>
  );
}
