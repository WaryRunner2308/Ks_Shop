import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPlataforma } from "@/lib/constantes";
import { etiquetaTipo } from "@/lib/metodos-pago";
import { aprobarPago, rechazarPago } from "./actions";

type Pago = {
  id: number;
  monto_declarado: number | null;
  estado: string;
  comprobante_url: string | null;
  created_at: string;
  usuarios: { nombre: string | null; email: string | null } | null;
  presupuestos: {
    plataforma: string;
    url_producto: string;
    variante: string | null;
  } | null;
  metodos_pago: { tipo: string } | null;
};

const ESTADO_PAGO_ETIQUETA: Record<string, string> = {
  registrado: "Registrado",
  verificado: "Verificado",
  rechazado: "Rechazado",
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

function Tarjeta({
  pago,
  urlComprobante,
}: {
  pago: Pago;
  urlComprobante: string | null;
}) {
  const cliente = pago.usuarios?.nombre || pago.usuarios?.email || "Cliente";
  const pendiente = pago.estado === "registrado";

  return (
    <li className="rounded-2xl border border-linea bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-tinta">{cliente}</p>
          {pago.presupuestos && (
            <>
              <p className="text-sm text-tinta-soft">
                {etiquetaPlataforma(pago.presupuestos.plataforma)}
                {pago.presupuestos.variante
                  ? ` · ${pago.presupuestos.variante}`
                  : ""}
              </p>
              <a
                href={pago.presupuestos.url_producto}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-md truncate text-sm text-coral-dark hover:underline"
              >
                {pago.presupuestos.url_producto}
              </a>
            </>
          )}
          <p className="mt-1 text-xs text-tinta-soft">
            {formatearFecha(pago.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl text-tinta">
            ${Number(pago.monto_declarado ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-tinta-soft">
            {pago.metodos_pago
              ? etiquetaTipo(pago.metodos_pago.tipo)
              : "Método eliminado"}
          </p>
          <span className="mt-1 inline-block rounded-full bg-crema-2 px-3 py-1 text-xs font-medium text-tinta">
            {ESTADO_PAGO_ETIQUETA[pago.estado] ?? pago.estado}
          </span>
        </div>
      </div>

      {/* Comprobante (con URL firmada temporal) */}
      <div className="mt-4">
        {urlComprobante ? (
          <a href={urlComprobante} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlComprobante}
              alt="Comprobante de pago"
              className="max-h-64 rounded-xl border border-linea object-contain"
            />
          </a>
        ) : (
          <p className="text-sm text-tinta-soft">
            No se pudo cargar el comprobante.
          </p>
        )}
      </div>

      {pendiente && (
        <div className="mt-4 flex gap-2">
          <form action={aprobarPago}>
            <input type="hidden" name="id" value={pago.id} />
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Aprobar pago
            </button>
          </form>
          <form action={rechazarPago}>
            <input type="hidden" name="id" value={pago.id} />
            <button
              type="submit"
              className="rounded-lg border border-coral/40 px-4 py-2 text-sm font-semibold text-coral-dark transition hover:bg-coral/10"
            >
              Rechazar pago
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default async function PagosAdminPage() {
  const supabase = await createClient();

  // RLS deja al admin leer todos los pagos y sus datos relacionados.
  const { data } = await supabase
    .from("pagos")
    .select(
      "id, monto_declarado, estado, comprobante_url, created_at, usuarios(nombre, email), presupuestos(plataforma, url_producto, variante), metodos_pago(tipo)",
    )
    .order("created_at", { ascending: false })
    .returns<Pago[]>();

  const pagos = data ?? [];

  // Generamos URLs firmadas (temporales) para los comprobantes del bucket privado.
  const rutas = pagos
    .map((p) => p.comprobante_url)
    .filter((r): r is string => !!r);

  const urlPorRuta = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage
      .from("comprobantes")
      .createSignedUrls(rutas, 3600); // válidas por 1 hora
    firmadas?.forEach((f) => {
      if (f.signedUrl && f.path) urlPorRuta.set(f.path, f.signedUrl);
    });
  }

  const pendientes = pagos.filter((p) => p.estado === "registrado");
  const revisados = pagos.filter((p) => p.estado !== "registrado");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <Link href="/admin" className="text-sm text-coral-dark hover:underline">
          ← Volver al panel
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta">
          Verificación de pagos
        </h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Revisa los comprobantes y aprueba o rechaza cada pago.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tinta">
          Por verificar
          <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-bold text-white">
            {pendientes.length}
          </span>
        </h2>
        {pendientes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-linea bg-white p-6 text-sm text-tinta-soft">
            No hay pagos por verificar. ¡Todo al día!
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {pendientes.map((p) => (
              <Tarjeta
                key={p.id}
                pago={p}
                urlComprobante={
                  p.comprobante_url
                    ? urlPorRuta.get(p.comprobante_url) ?? null
                    : null
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-tinta">
          Ya revisados <span className="text-tinta-soft">({revisados.length})</span>
        </h2>
        {revisados.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-linea bg-white p-6 text-sm text-tinta-soft">
            Todavía no has revisado ninguno.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {revisados.map((p) => (
              <Tarjeta
                key={p.id}
                pago={p}
                urlComprobante={
                  p.comprobante_url
                    ? urlPorRuta.get(p.comprobante_url) ?? null
                    : null
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
