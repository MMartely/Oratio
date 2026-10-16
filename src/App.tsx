import { useEffect, type ReactNode } from 'react';
import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthScreen } from './screens/auth/AuthScreen';
import { Home } from './screens/Home';
import { Onboarding } from './screens/onboarding/Onboarding';
import { Path } from './screens/Path';
import { Practice } from './screens/Practice';
import { Premium } from './screens/Premium';
import { Profile } from './screens/Profile';
import { ProgressScreen } from './screens/ProgressScreen';
import { Soon } from './screens/Soon';
import { Welcome } from './screens/Welcome';
import { useApp } from './store/useApp';

function RequireAuth({ children }: { children: ReactNode }) {
  const session = useApp((s) => s.session);
  const data = useApp((s) => s.data);
  const onboarded = useApp((s) => s.draft.done);
  if (!session || !data) return <Navigate to={onboarded ? '/signup' : '/welcome'} replace />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const session = useApp((s) => s.session);
  return session ? <Navigate to="/" replace /> : children;
}

function useDocumentSettings() {
  const { lang, theme } = useApp((s) => s.settings);
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [lang, theme]);
}

// L'aperçu partageable tourne dans un cadre où l'URL ne doit pas changer : routeur en mémoire.
const Router = import.meta.env.MODE === 'preview' ? MemoryRouter : HashRouter;

export default function App() {
  useDocumentSettings();
  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<GuestOnly><Welcome /></GuestOnly>} />
        <Route path="/onboarding" element={<GuestOnly><Onboarding /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><AuthScreen mode="signup" /></GuestOnly>} />
        <Route path="/signin" element={<GuestOnly><AuthScreen mode="signin" /></GuestOnly>} />
        <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />
        <Route path="/soon/:feature" element={<RequireAuth><Soon /></RequireAuth>} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Home />} />
          <Route path="/path" element={<Path />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
