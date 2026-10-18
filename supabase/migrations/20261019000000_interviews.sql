-- Entretiens simulés : un entretien consomme une seule analyse IA à son démarrage ;
-- les questions de relance et le bilan sont ensuite rattachés à cet entretien, dans une limite d'appels.
create table public.ai_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  calls integer not null default 0,
  finished boolean not null default false
);

alter table public.ai_interviews enable row level security;

-- Compte un appel pour un entretien en cours, récent, appartenant à l'utilisateur.
create function public.use_interview(p_id uuid, p_user uuid, p_max integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  found_id uuid;
begin
  update public.ai_interviews
  set calls = calls + 1
  where id = p_id and user_id = p_user and not finished and calls < p_max and created_at > now() - interval '2 hours'
  returning id into found_id;
  return found_id is not null;
end;
$$;

create function public.finish_interview(p_id uuid, p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.ai_interviews set finished = true where id = p_id and user_id = p_user;
$$;

revoke execute on function public.use_interview(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.finish_interview(uuid, uuid) from public, anon, authenticated;
grant execute on function public.use_interview(uuid, uuid, integer) to service_role;
grant execute on function public.finish_interview(uuid, uuid) to service_role;
