-- ============================================================================
-- Zona Originals · base de datos
--
-- CÓMO USAR: en Supabase abre "SQL Editor", pega TODO este archivo y pulsa Run.
-- Se puede correr más de una vez sin problema (no borra datos).
--
-- Al final hay UNA línea comentada para registrar el correo del administrador.
-- ============================================================================

-- ---------- Administradores ----------
-- Solo los correos de esta tabla pueden crear, editar o borrar. La tabla no es
-- visible desde la página: la consulta únicamente la función is_admin().
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Productos ----------
-- Cada producto es un documento JSON (nombre, precio, colores, fotos, etc.).
create table if not exists public.products (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select to anon, authenticated using (true);

drop policy if exists "products_admin" on public.products;
create policy "products_admin" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Categorías ----------
create table if not exists public.categories (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "categories_admin" on public.categories;
create policy "categories_admin" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Ajustes de la tienda (WhatsApp, redes, garantía, crédito…) ----------
-- Aquí NO se guarda ninguna clave: todo lo de esta tabla es público.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;

drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings
  for select to anon, authenticated using (true);

drop policy if exists "settings_admin" on public.settings;
create policy "settings_admin" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Reseñas ----------
-- Cualquier cliente puede enviar una reseña, pero siempre queda "pendiente".
-- Solo las aprobadas se ven en la tienda; el administrador ve todas.
create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews
  for select to anon, authenticated using (status = 'approved' or public.is_admin());

drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews
  for insert to anon, authenticated with check (status = 'pending');

drop policy if exists "reviews_admin" on public.reviews;
create policy "reviews_admin" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Fotos ----------
-- Carpeta pública "productos": todos pueden ver las fotos, solo el admin sube o borra.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;

drop policy if exists "productos_admin_write" on storage.objects;
create policy "productos_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());

-- ============================================================================
-- ÚLTIMO PASO (córrelo aparte, DESPUÉS de lo anterior):
-- cambia el correo por el del usuario que creaste en Authentication → Users.
--
--   insert into public.admins (email) values ('CORREO_DEL_ADMIN') on conflict do nothing;
--
-- Para quitar un administrador:
--
--   delete from public.admins where email = 'CORREO_DEL_ADMIN';
-- ============================================================================
