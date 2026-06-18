import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DISCLAIMER_ENVIO,
  ESTADO_ETIQUETA,
  etiquetaPlataforma,
} from "@/lib/constantes";

type Solicitud = {
  id: number;
  plataforma: string;
  url_producto: string;
  variante: string | null;
  precio_venta: number | null;
  estado: string;
  created_at: string;
};

export default async function MisSolicitudesPage() {
  const supabase = await createClient();

  // RLS garantiza que solo se devuelven las solicitudes del cliente logueado.
  const { data: solicitudes } = await supabase
    .from("presupuestos")
    .select("id, plataforma, url_producto, variante, precio_venta, estado, created_at")
    .order("created_at", { ascending: false })
    .returns<Solicitud[]>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="aparecer mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Volver
      </Link>

      <header className="mb-8 flex items-center justify-between gap-4 aparecer">
        <div>
          <h1 className="font-display text-3xl text-tinta">Mis solicitudes</h1>
          <p className="mt-2 text-sm text-tinta-soft">
            Aquí ves el estado de tus cotizaciones.
          </p>
        </div>
        <Link href="/cotizar" className="btn-coral shrink-0 px-4 py-2.5 text-sm">
          Pedir cotización
        </Link>
      </header>

      {!solicitudes || solicitudes.length === 0 ? (
        <div className="tarjeta aparecer border-dashed p-10 text-center">
          <p className="text-3xl">🛍️</p>
          <p className="mt-3 text-tinta-soft">Todavía no tienes solicitudes.</p>
          <Link
            href="/cotizar"
            className="mt-4 inline-block font-semibold text-coral-dark hover:underline"
          >
            Pedir mi primera cotización
          </Link>
        </div>
      ) : (
        <ul className="entrada flex flex-col gap-4">
          {solicitudes.map((s) => {
            const tienePrecio =
              s.precio_venta != null &&
              (s.estado === "cotizado" || s.estado === "pagado");
            const puedePagar =
              s.estado === "cotizado" && s.precio_venta != null;
            return (
              <li key={s.id} className="tarjeta tarjeta-flota p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-tinta">
                      {etiquetaPlataforma(s.plataforma)}
                    </p>
                    <a
                      href={s.url_producto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-coral-dark hover:underline"
                    >
                      {s.url_producto}
                    </a>
                    {s.variante && (
                      <p className="mt-1 text-sm text-tinta-soft">
                        Variante: {s.variante}
                      </p>
                    )}
                  </div>
                  <span className="chip shrink-0">
                    {ESTADO_ETIQUETA[s.estado] ?? s.estado}
                  </span>
                </div>

                {tienePrecio ? (
                  <div className="mt-4 rounded-xl border border-coral/15 bg-gradient-to-br from-crema to-crema-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-tinta-soft">
                      Precio
                    </p>
                    <p className="font-display text-3xl text-coral-dark">
                      ${Number(s.precio_venta).toFixed(2)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-tinta-soft">
                      {DISCLAIMER_ENVIO}
                    </p>
                    {puedePagar ? (
                      <Link
                        href={`/pagar/${s.id}`}
                        className="btn-coral mt-3 px-5 py-2.5 text-sm"
                      >
                        Pagar ahora
                      </Link>
                    ) : (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-tinta">
                        <span className="h-2 w-2 rounded-full bg-coral latido" />
                        Pago registrado · en verificación
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-tinta-soft">
                    Aún sin precio. Te avisaremos cuando esté cotizada.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
