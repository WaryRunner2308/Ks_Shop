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
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-tinta">Mis solicitudes</h1>
          <p className="mt-2 text-sm text-tinta-soft">
            Aquí ves el estado de tus cotizaciones.
          </p>
        </div>
        <Link
          href="/cotizar"
          className="shrink-0 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-dark"
        >
          Pedir cotización
        </Link>
      </header>

      {!solicitudes || solicitudes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-linea bg-white p-10 text-center">
          <p className="text-tinta-soft">Todavía no tienes solicitudes.</p>
          <Link
            href="/cotizar"
            className="mt-4 inline-block font-semibold text-coral-dark hover:underline"
          >
            Pedir mi primera cotización
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {solicitudes.map((s) => {
            const cotizada = s.estado === "cotizado" && s.precio_venta != null;
            return (
              <li
                key={s.id}
                className="rounded-2xl border border-linea bg-white p-5"
              >
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
                  <span className="shrink-0 rounded-full bg-crema-2 px-3 py-1 text-xs font-medium text-tinta">
                    {ESTADO_ETIQUETA[s.estado] ?? s.estado}
                  </span>
                </div>

                {cotizada ? (
                  <div className="mt-4 rounded-xl bg-crema p-4">
                    <p className="text-sm text-tinta-soft">Precio</p>
                    <p className="font-display text-2xl text-tinta">
                      ${Number(s.precio_venta).toFixed(2)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-tinta-soft">
                      {DISCLAIMER_ENVIO}
                    </p>
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
