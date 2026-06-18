import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPlataforma } from "@/lib/constantes";
import { ocultarConfirmadaAdmin, vaciarConfirmadasAdmin } from "./actions";

type Confirmada = {
  id: number;
  plataforma: string;
  url_producto: string;
  variante: string | null;
  precio_venta: number | null;
  created_at: string;
  usuarios: { nombre: string | null; email: string | null } | null;
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ConfirmadasAdminPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("presupuestos")
    .select(
      "id, plataforma, url_producto, variante, precio_venta, created_at, usuarios(nombre, email)",
    )
    .eq("estado", "confirmado")
    .eq("archivada_admin", false)
    .order("created_at", { ascending: false })
    .returns<Confirmada[]>();

  const confirmadas = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 aparecer">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-coral-dark transition hover:gap-2 hover:underline"
        >
          ← Volver al panel
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-tinta">
              Cotizaciones <span className="italic texto-fucsia">confirmadas</span>
            </h1>
            <p className="mt-2 text-sm text-tinta-soft">
              Pedidos con el pago ya confirmado.
            </p>
          </div>
          {confirmadas.length > 0 && (
            <form action={vaciarConfirmadasAdmin}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-coral/40 px-4 py-2 text-sm font-medium text-coral-dark transition hover:bg-coral/10"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
                Vaciar historial
              </button>
            </form>
          )}
        </div>
      </header>

      {confirmadas.length === 0 ? (
        <p className="tarjeta border-dashed p-10 text-center text-sm text-tinta-soft">
          No hay cotizaciones confirmadas. ✨
        </p>
      ) : (
        <ul className="entrada flex flex-col gap-4">
          {confirmadas.map((s) => {
            const cliente =
              s.usuarios?.nombre || s.usuarios?.email || "Cliente";
            return (
              <li
                key={s.id}
                className="tarjeta tarjeta-flota flex items-start justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip">
                      {etiquetaPlataforma(s.plataforma)}
                    </span>
                    <span className="text-sm font-medium text-tinta">
                      {cliente}
                    </span>
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
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {s.precio_venta != null && (
                    <span className="font-display text-xl text-coral-dark">
                      ${Number(s.precio_venta).toFixed(2)}
                    </span>
                  )}
                  <form action={ocultarConfirmadaAdmin}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-tinta-soft transition hover:bg-white/[0.06] hover:text-coral-dark"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
