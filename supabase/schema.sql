-- Esquema inicial de K's Shop
-- Negocio de compras bajo pedido (AliExpress, Shein, Alibaba).

-- Enums
create type rol_usuario as enum ('cliente', 'admin');
create type estado_presupuesto as enum ('pendiente', 'cotizado', 'pagado', 'cancelado');
create type estado_pago as enum ('pendiente', 'verificado', 'rechazado');

-- Tablas
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  email text,
  rol rol_usuario not null default 'cliente',
  created_at timestamptz not null default now()
);

create table configuracion (
  id bigint generated always as identity primary key,
  porcentaje_ganancia numeric(5,4) not null default 0.2000,
  updated_at timestamptz not null default now()
);

create table metodos_pago (
  id bigint generated always as identity primary key,
  nombre text not null,
  detalles text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table presupuestos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  link text not null,
  variante text,
  precio_real numeric(12,2),
  total numeric(12,2),
  porcentaje_ganancia_usado numeric(5,4),
  estado estado_presupuesto not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pagos (
  id bigint generated always as identity primary key,
  presupuesto_id bigint not null references presupuestos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  comprobante_url text,
  monto numeric(12,2),
  estado estado_pago not null default 'pendiente',
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

-- Configuracion inicial (20% de ganancia)
insert into configuracion (porcentaje_ganancia) values (0.2000);
