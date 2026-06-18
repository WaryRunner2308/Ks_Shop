import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DISCLAIMER_ENVIO,
  ESTADO_ETIQUETA,
  etiquetaPlataforma,
} from "@/lib/constantes";
import FormularioPrecio from "./formulario-precio";

type Cliente = { nombre: string | null; email: string | null };

type Solicitud = {
  id: number;
  plataforma: string;
  url_producto: string;
  variante: string | null;
  precio_venta: number | null;
  estado: string;
  created_at: string;
  usuarios: Cliente | null;
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Color de la insignia de estado (dentro de la paleta de marca).
const ESTADO_CHIP: Record<string, string> = {
  solicitado: "bg-coral/15 text-coral-dark",
  cotizado: "bg-crema-2 text-tinta",
  pagado: "bg-green-100 text-green-700",
  cancelado: "bg-tinta/10 text-tinta-soft",
};

function Tarjeta({ s }: { s: Solicitud }) {
  const cliente = s.usuarios?.nombre || s.usuarios?.email || "Cliente";
  const pendiente = s.estado === "solicitado";

  return (
    <li
      className={`tarjeta tarjeta-flota p-5 ${pendiente ? "border-coral/40" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{etiquetaPlataforma(s.plataforma)}</span>
            <span className="text-sm font-medium text-tinta">{cliente}</span>
          </div>
          <a
            href={s.url_producto}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block max-w-md truncate text-sm text-coral-dark hover:underline"
          >
            {s.url_producto}
          </a>
          {s.variante && (
            <p className="mt-1 text-sm text-tinta-soft">
              Variante: {s.variante}
            </p>
          )}
          <p className="mt-1 text-xs text-tinta-soft">
            {formatearFecha(s.created_at)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            ESTADO_CHIP[s.estado] ?? "bg-crema-2 text-tinta"
          }`}
        >
          {ESTADO_ETIQUETA[s.estado] ?? s.estado}
        </span>
      </div>

      {pendiente ? (
        <FormularioPrecio id={s.id} />
      ) : (
        s.precio_venta != null && (
          <div className="mt-3 rounded-xl bg-white/50 px-4 py-2.5 text-sm text-tinta-soft">
            Precio enviado:{" "}
            <span className="font-semibold text-coral-dark">
              ${Number(s.precio_venta).toFixed(2)}
            </span>
          </div>
        )
      )}
    </li>
  );
}

// Tarjetita de resumen (contador rápido del estado del negocio).
function Resumen({
  valor,
  etiqueta,
  destacado = false,
}: {
  valor: number;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`tarjeta tarjeta-flota p-4 text-center sm:p-5 ${
        destacado ? "border-coral/40" : ""
      }`}
    >
      <p
        className={`font-display text-3xl sm:text-4xl ${
          destacado ? "texto-fucsia" : "text-tinta"
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-xs font-medium text-tinta-soft sm:text-sm">
        {etiqueta}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  // RLS permite al admin leer TODAS las solicitudes. Se incluye el nombre/correo
  // del cliente que la pidió.
  const { data } = await supabase
    .from("presupuestos")
    .select(
      "id, plataforma, url_producto, variante, precio_venta, estado, created_at, usuarios(nombre, email)",
    )
    .order("created_at", { ascending: false })
    .returns<Solicitud[]>();

  const solicitudes = data ?? [];
  const pendientes = solicitudes.filter((s) => s.estado === "solicitado");
  const cotizadas = solicitudes.filter((s) => s.estado !== "solicitado");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Encabezado tipo "hero" */}
      <header className="aparecer mb-8">
        <p className="chip mb-4 px-4 py-1.5 text-xs uppercase tracking-[0.2em]">
          <span className="h-1.5 w-1.5 rounded-full bg-coral latido" />
          Tu panel
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-tinta sm:text-5xl">
          Solicitudes de{" "}
          <span className="italic texto-fucsia">cotización</span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-tinta-soft">
          Revisa los productos desde tu cuenta y envía el precio de venta.
        </p>
      </header>

      {/* Resumen rápido */}
      <section className="entrada mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <Resumen valor={pendientes.length} etiqueta="Pendientes" destacado />
        <Resumen valor={cotizadas.length} etiqueta="Cotizadas" />
        <Resumen valor={solicitudes.length} etiqueta="Total" />
      </section>

      {/* Accesos rápidos */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/clientes" className="btn-linea px-4 py-2 text-sm">
          Clientes
        </Link>
        <Link href="/admin/pagos" className="btn-linea px-4 py-2 text-sm">
          Pagos
        </Link>
        <Link
          href="/admin/metodos-pago"
          className="btn-linea px-4 py-2 text-sm"
        >
          Métodos de pago
        </Link>
      </div>

      {/* Recordatorio del disclaimer obligatorio */}
      <p className="mb-10 rounded-2xl border border-linea bg-white/60 px-4 py-3 text-xs leading-relaxed text-tinta-soft">
        💡 Recuerda: {DISCLAIMER_ENVIO}
      </p>

      {/* Pendientes primero: lo que falta responder */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tinta">
          Pendientes
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-2 text-xs font-bold text-white">
            {pendientes.length}
          </span>
        </h2>
        {pendientes.length === 0 ? (
          <p className="tarjeta border-dashed p-6 text-center text-sm text-tinta-soft">
            No hay solicitudes pendientes. ¡Todo al día! ✨
          </p>
        ) : (
          <ul className="entrada flex flex-col gap-4">
            {pendientes.map((s) => (
              <Tarjeta key={s.id} s={s} />
            ))}
          </ul>
        )}
      </section>

      {/* Ya cotizadas */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-tinta">
          Ya cotizadas{" "}
          <span className="text-tinta-soft">({cotizadas.length})</span>
        </h2>
        {cotizadas.length === 0 ? (
          <p className="tarjeta border-dashed p-6 text-center text-sm text-tinta-soft">
            Todavía no has cotizado ninguna.
          </p>
        ) : (
          <ul className="entrada flex flex-col gap-4">
            {cotizadas.map((s) => (
              <Tarjeta key={s.id} s={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
