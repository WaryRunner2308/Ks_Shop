-- Esquema inicial de K's Shop
-- Negocio de compras bajo pedido (AliExpress, Shein, Alibaba).

-- Enums
create type rol_usuario as enum ('cliente', 'admin');
create type estado_presupuesto as enum ('solicitado', 'cotizado', 'pagado', 'cancelado');
create type estado_pago as enum ('registrado', 'verificado', 'rechazado');
create type plataforma_compra as enum ('aliexpress', 'shein', 'alibaba');
create type tipo_metodo_pago as enum ('pago_movil', 'transferencia', 'binance', 'paypal', 'zelle');

-- Tablas
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  email text,
  rol rol_usuario not null default 'cliente',
  created_at timestamptz not null default now()
);

-- Tabla de configuracion general (reservada para ajustes futuros: datos de
-- contacto, mensajes, etc.). Ya NO contiene porcentaje_ganancia.
create table configuracion (
  id bigint generated always as identity primary key,
  updated_at timestamptz not null default now()
);

create table metodos_pago (
  id bigint generated always as identity primary key,
  tipo tipo_metodo_pago not null,
  detalles jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table presupuestos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  plataforma plataforma_compra not null,
  url_producto text not null,
  variante text,
  precio_venta numeric(12,2),
  estado estado_presupuesto not null default 'solicitado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pagos (
  id bigint generated always as identity primary key,
  presupuesto_id bigint not null references presupuestos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  metodo_pago_id bigint references metodos_pago(id) on delete set null,
  comprobante_url text,
  monto_declarado numeric(12,2),
  estado estado_pago not null default 'registrado',
  created_at timestamptz not null default now()
);

create table notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid references usuarios(id) on delete cascade,
  presupuesto_id bigint references presupuestos(id) on delete cascade,
  mensaje text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indices
create index idx_presupuestos_usuario_id on presupuestos(usuario_id);
create index idx_presupuestos_estado on presupuestos(estado);
create index idx_pagos_presupuesto_id on pagos(presupuesto_id);
create index idx_pagos_estado on pagos(estado);
create index idx_notificaciones_leida on notificaciones(leida);


-- ============================================================
-- SEGURIDAD: Row Level Security (RLS) y politicas
-- ============================================================

-- Activar RLS en todas las tablas
alter table usuarios enable row level security;
alter table configuracion enable row level security;
alter table metodos_pago enable row level security;
alter table presupuestos enable row level security;
alter table pagos enable row level security;
alter table notificaciones enable row level security;

-- Funcion helper: detecta si el usuario actual (logueado) es la duena (admin).
-- Vive en el schema privado para que NO sea llamable desde la API publica.
-- SECURITY DEFINER evita recursion al leer la tabla usuarios dentro de sus propias politicas.
create schema if not exists private;

create or replace function private.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and rol = 'admin'
  );
$$;

grant usage on schema private to authenticated;
revoke all on function private.es_admin() from public, anon;
grant execute on function private.es_admin() to authenticated;

-- USUARIOS: cada quien ve/edita lo suyo; la duena ve/edita todo. Nadie se auto-asciende a admin.
create policy usuarios_select on usuarios for select to authenticated
  using (id = auth.uid() or private.es_admin());
create policy usuarios_insert on usuarios for insert to authenticated
  with check (id = auth.uid() and rol = 'cliente');
create policy usuarios_update on usuarios for update to authenticated
  using (id = auth.uid() or private.es_admin())
  with check (private.es_admin() or (id = auth.uid() and rol = 'cliente'));

-- CONFIGURACION: privada, solo la duena la ve y la modifica.
create policy configuracion_admin on configuracion for all to authenticated
  using (private.es_admin()) with check (private.es_admin());

-- METODOS_PAGO: todos los logueados ven los activos; solo la duena los administra.
create policy metodos_pago_select on metodos_pago for select to authenticated
  using (activo or private.es_admin());
create policy metodos_pago_insert on metodos_pago for insert to authenticated
  with check (private.es_admin());
create policy metodos_pago_update on metodos_pago for update to authenticated
  using (private.es_admin()) with check (private.es_admin());
create policy metodos_pago_delete on metodos_pago for delete to authenticated
  using (private.es_admin());

-- PRESUPUESTOS: el cliente ve y crea los suyos; solo la duena edita (pone precios) y borra.
create policy presupuestos_select on presupuestos for select to authenticated
  using (usuario_id = auth.uid() or private.es_admin());
create policy presupuestos_insert on presupuestos for insert to authenticated
  with check (usuario_id = auth.uid());
create policy presupuestos_update on presupuestos for update to authenticated
  using (private.es_admin()) with check (private.es_admin());
create policy presupuestos_delete on presupuestos for delete to authenticated
  using (private.es_admin());

-- PAGOS: el cliente ve y sube los suyos; solo la duena los verifica/rechaza y borra.
create policy pagos_select on pagos for select to authenticated
  using (usuario_id = auth.uid() or private.es_admin());
create policy pagos_insert on pagos for insert to authenticated
  with check (usuario_id = auth.uid());
create policy pagos_update on pagos for update to authenticated
  using (private.es_admin()) with check (private.es_admin());
create policy pagos_delete on pagos for delete to authenticated
  using (private.es_admin());

-- NOTIFICACIONES: son para la duena; solo ella las lee, marca leidas y borra.
-- El insert se hace desde el servidor (service_role, que omite RLS), por eso no hay
-- politica de insert para clientes.
create policy notificaciones_select on notificaciones for select to authenticated
  using (private.es_admin());
create policy notificaciones_update on notificaciones for update to authenticated
  using (private.es_admin()) with check (private.es_admin());
create policy notificaciones_delete on notificaciones for delete to authenticated
  using (private.es_admin());


-- ============================================================
-- TRIGGER: al registrar un pago, el presupuesto pasa a "pagado"
-- ============================================================
-- SECURITY DEFINER: asi el cliente NO necesita permiso de update sobre
-- presupuestos (que sigue siendo solo de la duena).
create or replace function private.marcar_presupuesto_pagado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update presupuestos
  set estado = 'pagado', updated_at = now()
  where id = new.presupuesto_id and estado = 'cotizado';
  return new;
end;
$$;

create trigger pago_marca_presupuesto
  after insert on pagos
  for each row execute function private.marcar_presupuesto_pagado();


-- ============================================================
-- STORAGE: bucket privado de comprobantes de pago
-- ============================================================
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Subir: solo logueados, y solo dentro de su propia carpeta (su user id).
create policy "comprobantes_subir_propios"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'comprobantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Ver: el cliente ve los suyos; la duena (admin) ve los de todos.
create policy "comprobantes_ver_propios_o_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'comprobantes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or private.es_admin()
  )
);


-- ============================================================
-- NOTIFICACIONES: triggers que avisan a la duena + Realtime
-- ============================================================
-- Aviso cuando un cliente crea una solicitud de cotizacion.
create or replace function private.notificar_nueva_solicitud()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_cliente text;
begin
  select coalesce(nullif(nombre, ''), email, 'Un cliente')
    into nombre_cliente
  from usuarios where id = new.usuario_id;

  insert into notificaciones (presupuesto_id, mensaje)
  values (
    new.id,
    'Nueva solicitud de cotización de ' || coalesce(nombre_cliente, 'un cliente')
  );
  return new;
end;
$$;

create trigger presupuesto_notifica_admin
  after insert on presupuestos
  for each row execute function private.notificar_nueva_solicitud();

-- Aviso cuando un cliente registra un pago.
create or replace function private.notificar_nuevo_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_cliente text;
begin
  select coalesce(nullif(nombre, ''), email, 'Un cliente')
    into nombre_cliente
  from usuarios where id = new.usuario_id;

  insert into notificaciones (presupuesto_id, mensaje)
  values (
    new.presupuesto_id,
    coalesce(nombre_cliente, 'Un cliente') || ' registró un pago de $'
      || to_char(coalesce(new.monto_declarado, 0), 'FM999999990.00')
  );
  return new;
end;
$$;

create trigger pago_notifica_admin
  after insert on pagos
  for each row execute function private.notificar_nuevo_pago();

-- Activar Realtime para transmitir los cambios de notificaciones en vivo.
alter publication supabase_realtime add table notificaciones;
