-- Rappels enrichis : jours choisis, alerte « série en danger » le soir et « bravo » le lendemain d'une leçon.
alter table public.push_subscriptions
  -- Jours du rappel : bit 0 = lundi … bit 6 = dimanche (127 = tous les jours).
  add column days smallint not null default 127 check (days between 1 and 127),
  add column streak_alert boolean not null default true,
  add column bravo boolean not null default true,
  -- Dates des derniers envois, écrites seulement par le serveur.
  add column streak_sent_day date,
  add column bravo_sent_day date;

grant update (days, streak_alert, bravo) on public.push_subscriptions to authenticated;
