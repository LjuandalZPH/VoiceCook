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
