
-- Roles enum
create type public.app_role as enum ('admin', 'colaborador');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = user_id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "user_roles_select_self" on public.user_roles
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "user_roles_admin_manage" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Restrict turnos/analytics/asesores SELECT to admins
drop policy if exists "turnos_select_public" on public.turnos;
drop policy if exists "turnos_update_public" on public.turnos;
drop policy if exists "analytics_select_public" on public.analytics;
drop policy if exists "asesores_select_public" on public.asesores;

create policy "turnos_select_admin" on public.turnos
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "turnos_update_admin" on public.turnos
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "analytics_select_admin" on public.analytics
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "asesores_select_admin" on public.asesores
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
