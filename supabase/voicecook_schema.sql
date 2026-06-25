create table if not exists public.recipes (
  id text primary key,
  nombre text not null,
  categoria text not null,
  descripcion text not null,
  "tiempoTotal" text not null,
  "ingredientesTotales" jsonb not null default '[]'::jsonb,
  pasos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint recipes_ingredientes_array check (jsonb_typeof("ingredientesTotales") = 'array'),
  constraint recipes_pasos_array check (jsonb_typeof(pasos) = 'array')
);

create table if not exists public.device_profiles (
  device_id uuid primary key,
  favorites jsonb not null default '[]'::jsonb,
  last_recipe_id text references public.recipes(id) on update cascade on delete set null,
  last_step_index integer,
  updated_at timestamptz not null default now(),
  constraint device_profiles_favorites_array check (jsonb_typeof(favorites) = 'array'),
  constraint device_profiles_last_step_nonnegative check (last_step_index is null or last_step_index >= 0)
);

create index if not exists recipes_categoria_idx on public.recipes (categoria);
create index if not exists device_profiles_last_recipe_id_idx on public.device_profiles (last_recipe_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_device_profiles_updated_at on public.device_profiles;

create trigger set_device_profiles_updated_at
before update on public.device_profiles
for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;
alter table public.device_profiles enable row level security;

drop policy if exists "Recipes are publicly readable" on public.recipes;

create policy "Recipes are publicly readable"
on public.recipes
for select
to anon, authenticated
using (true);

drop policy if exists "Anonymous devices can read profiles" on public.device_profiles;

create policy "Anonymous devices can read profiles"
on public.device_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Anonymous devices can create profiles" on public.device_profiles;

create policy "Anonymous devices can create profiles"
on public.device_profiles
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anonymous devices can update profiles" on public.device_profiles;

create policy "Anonymous devices can update profiles"
on public.device_profiles
for update
to anon, authenticated
using (true)
with check (true);

grant select on public.recipes to anon, authenticated;
grant select, insert, update on public.device_profiles to anon, authenticated;

-- =====================================================
-- USER PROFILES
-- Perfil básico de usuarios autenticados
-- =====================================================

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on update cascade on delete cascade,
  full_name text not null default '',
  cooking_preferences jsonb not null default '[]'::jsonb,
  dietary_restrictions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_profiles_cooking_preferences_array 
    check (jsonb_typeof(cooking_preferences) = 'array'),

  constraint user_profiles_dietary_restrictions_array 
    check (jsonb_typeof(dietary_restrictions) = 'array')
);

create index if not exists user_profiles_full_name_idx 
on public.user_profiles (full_name);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;

create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.user_profiles;

create policy "Users can create own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;

create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant select, insert, update on public.user_profiles to authenticated;

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    full_name,
    cooking_preferences,
    dietary_restrictions
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    '[]'::jsonb,
    '[]'::jsonb
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.create_user_profile();