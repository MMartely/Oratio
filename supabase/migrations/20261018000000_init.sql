-- Oratio : comptes, progression, séances d'analyse, quota d'analyses IA et enregistrements Premium.

-- Profil de chaque utilisateur : réponses d'onboarding et progression dans `data`.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  plan text not null default 'free' check (plan in ('free', 'premium')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Chacun lit son profil" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Chacun modifie son profil" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- La formule (plan) ne se change que côté serveur : l'utilisateur ne peut modifier que ces colonnes.
revoke update on public.profiles from authenticated;
grant update (name, data, updated_at) on public.profiles to authenticated;

-- Création automatique du profil à l'inscription (e-mail ou Google).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bilans d'analyse vocale (le bilan complet est dans `result`).
create table public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  score smallint not null check (score between 0 and 100),
  result jsonb not null
);

create index sessions_user_created_idx on public.sessions (user_id, created_at desc);

alter table public.sessions enable row level security;

create policy "Chacun lit ses séances" on public.sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Chacun ajoute ses séances" on public.sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Chacun supprime ses séances" on public.sessions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Analyses IA consommées par jour. Aucun accès direct : seule la fonction « coach » y touche.
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Réserve une analyse IA : toujours accordée en Premium, sinon dans la limite du jour.
create function public.consume_ai_credit(p_user uuid, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  used integer;
begin
  if exists (select 1 from public.profiles where id = p_user and plan = 'premium') then
    return true;
  end if;
  insert into public.ai_usage as u (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
  returning u.count into used;
  return used is not null;
end;
$$;

-- Rend l'analyse réservée si l'appel au coach a échoué.
create function public.refund_ai_credit(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.ai_usage set count = greatest(count - 1, 0) where user_id = p_user and day = current_date;
$$;

revoke execute on function public.consume_ai_credit(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refund_ai_credit(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, integer) to service_role;
grant execute on function public.refund_ai_credit(uuid) to service_role;

-- Enregistrements audio : privés, rangés par utilisateur, réservés à la formule Premium.
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false);

create policy "Premium : déposer ses enregistrements" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles where id = (select auth.uid()) and plan = 'premium')
  );
create policy "Lire ses enregistrements" on storage.objects
  for select to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Supprimer ses enregistrements" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
