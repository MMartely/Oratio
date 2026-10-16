import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { getCoach } from '../../data/coaches';
import { CoachAvatar } from '../../components/CoachAvatar';
import { BackButton, Button, Screen } from '../../components/ui';
import { useI18n } from '../../i18n';
import { backend } from '../../services/backend';
import { useApp } from '../../store/useApp';
import { AuthError, type AuthErrorCode } from '../../types';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-ink outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function AuthScreen({ mode }: { mode: 'signup' | 'signin' }) {
  const { d } = useI18n();
  const navigate = useNavigate();
  const draft = useApp((s) => s.draft);
  const startSession = useApp((s) => s.startSession);
  const coach = getCoach(draft.coachId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<Parameters<typeof startSession>[0]>) => {
    setBusy(true);
    setError(null);
    try {
      await startSession(await action());
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof AuthError ? e.code : 'unknown');
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => (mode === 'signup' ? backend.signUp(name, email, password) : backend.signIn(email, password)));
  };

  const isSignUp = mode === 'signup';

  return (
    <Screen>
      <BackButton to={isSignUp ? '/onboarding' : '/welcome'} label={d.common.back} />
      <div className="mt-2 flex-1 animate-rise">
        <CoachAvatar coach={coach} size={64} />
        <h1 className="mt-4 text-3xl font-semibold">{isSignUp ? d.auth.signUpTitle : d.auth.signInTitle}</h1>
        <p className="mt-1 text-muted">{isSignUp ? d.auth.signUpSubtitle : d.auth.signInSubtitle}</p>

        <Button
          full
          variant="secondary"
          className="mt-6"
          disabled={busy}
          onClick={() => void run(() => backend.signInWithGoogle(name.trim() || d.auth.guestName))}
        >
          <GoogleLogo />
          {d.auth.google}
        </Button>

        <div className="my-5 flex items-center gap-3 text-sm text-muted">
          <span className="h-px flex-1 bg-line" />
          {d.auth.or}
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {isSignUp && (
            <Field label={d.auth.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          )}
          <Field
            label={d.auth.email}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Field
            label={d.auth.password}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            hint={isSignUp ? d.auth.passwordHint : undefined}
          />
          {error && (
            <p role="alert" className="rounded-2xl bg-peach/20 px-4 py-3 text-sm font-semibold">
              {d.auth.errors[error]}
            </p>
          )}
          <Button full type="submit" disabled={busy}>
            {isSignUp ? d.auth.signUp : d.auth.signIn}
          </Button>
        </form>

        <Link to={isSignUp ? '/signin' : '/signup'} className="mt-4 block text-center text-sm font-bold text-primary">
          {isSignUp ? d.auth.toSignIn : d.auth.toSignUp}
        </Link>
      </div>

      {backend.mode === 'demo' && (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted">
          <Info size={14} />
          {d.common.demoMode}
        </p>
      )}
    </Screen>
  );
}
