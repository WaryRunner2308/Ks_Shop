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

function Tarjeta({ s }: { s: Solicitud }) {
  const cliente = s.usuarios?.nombre || s.usuarios?.email || "Cliente";
  const pendiente = s.estado === "solicitado";

  return (
    <li className="rounded-2xl border border-linea bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-tinta">
              {etiquetaPlataforma(s.plataforma)}
            </span>
            <span className="text-sm text-tinta-soft">· {cliente}</span>
          </div>
          <a
            href={s.url_producto}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-md truncate text-sm text-coral-dark hover:underline"
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
        <span className="shrink-0 rounded-full bg-crema-2 px-3 py-1 text-xs font-medium text-tinta">
          {ESTADO_ETIQUETA[s.estado] ?? s.estado}
        </span>
      </div>

      {pendiente ? (
        <FormularioPrecio id={s.id} />
      ) : (
        s.precio_venta != null && (
          <div className="mt-3 text-sm text-tinta-soft">
            Precio enviado:{" "}
            <span className="font-semibold text-tinta">
              ${Number(s.precio_venta).toFixed(2)}
            </span>
          </div>
        )
      )}
    </li>
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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-tinta">
          Solicitudes de cotización
        </h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Revisa los productos desde tu cuenta y envía el precio de venta.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-tinta-soft">
          Recuerda: {DISCLAIMER_ENVIO}
        </p>
      </header>

      {/* Pendientes primero: lo que falta responder */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tinta">
          Pendientes
          <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-bold text-white">
            {pendientes.length}
          </span>
        </h2>
        {pendientes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-linea bg-white p-6 text-sm text-tinta-soft">
            No hay solicitudes pendientes. ¡Todo al día!
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
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
          <p className="rounded-2xl border border-dashed border-linea bg-white p-6 text-sm text-tinta-soft">
            Todavía no has cotizado ninguna.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {cotizadas.map((s) => (
              <Tarjeta key={s.id} s={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
