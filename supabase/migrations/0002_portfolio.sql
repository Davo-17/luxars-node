-- LuxArs: portafolio con fotos reales
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query

-- 1) Bucket publico de Storage para las fotos/videos
insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

-- 2) Tabla de items del portafolio
create table if not exists public.portfolio_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  tags text[] default '{}',
  type text not null default 'imagen' check (type in ('imagen', 'video')),
  file_url text not null,
  created_at timestamptz default now()
);

-- 3) RLS en portfolio_items
alter table public.portfolio_items enable row level security;

drop policy if exists "Portfolio items are viewable" on public.portfolio_items;
create policy "Portfolio items are viewable"
  on public.portfolio_items for select
  using (true);

drop policy if exists "Users can insert own portfolio" on public.portfolio_items;
create policy "Users can insert own portfolio"
  on public.portfolio_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own portfolio" on public.portfolio_items;
create policy "Users can update own portfolio"
  on public.portfolio_items for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own portfolio" on public.portfolio_items;
create policy "Users can delete own portfolio"
  on public.portfolio_items for delete
  using (auth.uid() = user_id);

-- 4) Storage: cualquiera puede leer, solo usuarios logueados pueden subir
drop policy if exists "Public read portfolios" on storage.objects;
create policy "Public read portfolios"
  on storage.objects for select
  using (bucket_id = 'portfolios');

drop policy if exists "Auth upload portfolios" on storage.objects;
create policy "Auth upload portfolios"
  on storage.objects for insert
  with check (bucket_id = 'portfolios' and auth.role() = 'authenticated');

drop policy if exists "Auth update portfolios" on storage.objects;
create policy "Auth update portfolios"
  on storage.objects for update
  using (bucket_id = 'portfolios' and auth.role() = 'authenticated');

drop policy if exists "Auth delete portfolios" on storage.objects;
create policy "Auth delete portfolios"
  on storage.objects for delete
  using (bucket_id = 'portfolios' and auth.role() = 'authenticated');
