-- Rappels quotidiens par notification : un abonnement par appareil.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  -- Heure du rappel en minutes depuis minuit, dans le fuseau horaire de l'utilisateur.
  reminder_minutes smallint not null check (reminder_minutes between 0 and 1439),
  timezone text not null,
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  coach_id text not null default 'lea' check (coach_id in ('lea', 'malik', 'sofia')),
  last_sent_day date,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Chacun voit ses abonnements" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Chacun ajoute ses abonnements" on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Chacun modifie ses abonnements" on public.push_subscriptions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Chacun supprime ses abonnements" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- La date du dernier envoi n'est écrite que par le serveur.
revoke update on public.push_subscriptions from authenticated;
-- endpoint et user_id sont réécrits (à l’identique) quand l’application réenregistre le rappel ; la règle d’accès garantit user_id.
grant update (endpoint, user_id, p256dh, auth, reminder_minutes, timezone, lang, coach_id) on public.push_subscriptions to authenticated;

-- Réglages internes du serveur (clés des notifications), jamais lisibles depuis l'application.
create table public.app_secrets (
  name text primary key,
  value text not null
);

alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
