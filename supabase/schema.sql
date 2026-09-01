-- Ejecuta esto en Supabase: Dashboard > SQL Editor > New query > Run

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  character_id text not null,
  character_name text not null,
  name_to_print text not null,
  size_label text not null,
  shape_id text not null,
  shape_label text not null,
  packages int not null default 1,
  quantity int not null,
  total numeric not null,
  customer_name text not null,
  customer_whatsapp text not null,
  note text,
  wants_preview boolean not null default false,
  status text not null default 'pendiente_pago' check (status in ('pendiente_pago', 'nuevo', 'en_produccion', 'enviada'))
);

-- Habilita Row Level Security
alter table orders enable row level security;

-- Cualquiera puede CREAR un pedido (el formulario público de clientes)
create policy "Cualquiera puede crear pedidos"
  on orders for insert
  to anon
  with check (true);

-- Cualquiera con el link puede LEER y ACTUALIZAR pedidos (panel del taller).
-- Esto es simple pero no 100% seguro: cualquiera con tu anon key podría leer/editar pedidos.
-- Si más adelante quieres protegerlo de verdad, cambia esto a "to authenticated"
-- y agrega Supabase Auth (login con correo) para el panel.
create policy "Lectura y actualización abiertas"
  on orders for select
  to anon
  using (true);

create policy "Actualizar estado"
  on orders for update
  to anon
  using (true)
  with check (true);

create policy "Borrar pedidos"
  on orders for delete
  to anon
  using (true);

-- Habilita las actualizaciones en tiempo real para esta tabla
alter publication supabase_realtime add table orders;
