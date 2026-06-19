import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DISCLAIMER_ENVIO,
  ESTADO_ETIQUETA,
  etiquetaPlataforma,
  TIPO_ETIQUETA,
} from "@/lib/constantes";
import ContadorOferta from "@/app/components/contador-oferta";
import NotasCotizacion, { type Nota } from "@/app/components/notas-cotizacion";

type Solicitud = {
  id: number;
  plataforma: string;
  url_producto: string;
  variante: string | null;
  precio_venta: number | null;
  estado: string;
  created_at: string;
  expira_en: string | null;
  tipo: string;
  imagen_url: string | null;
};

// Filtros disponibles y cómo deciden si una solicitud entra.
const FILTROS = [
  { clave: "todas", etiqueta: "Todas" },
  { clave: "espera", etiqueta: "En espera" },
  { clave: "cotizadas", etiqueta: "Cotizadas" },
] as const;

function pasaFiltro(estado: string, filtro: string): boolean {
  if (filtro === "espera") return estado === "solicitado";
  if (filtro === "cotizadas")
    return estado === "cotizado" || estado === "pagado";
  return true; // "todas"
}

export default async function MisSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro: filtroRaw } = await searchParams;
  const filtro = FILTROS.some((f) => f.clave === filtroRaw)
    ? (filtroRaw as string)
    : "todas";

  const supabase = await createClient();

  // RLS garantiza que solo se devuelven las solicitudes del cliente logueado.
  const { data } = await supabase
    .from("presupuestos")
    .select("id, plataforma, url_producto, variante, precio_venta, estado, created_at, expira_en, tipo, imagen_url")
    .order("created_at", { ascending: false })
    .returns<Solicitud[]>();

  // Las confirmadas salen de aquí y van a su propia página /confirmadas.
  const activas = (data ?? []).filter((s) => s.estado !== "confirmado");
  const solicitudes = activas.filter((s) => pasaFiltro(s.estado, filtro));

  // URLs firmadas (temporales) para mostrar la imagen de referencia que subió el
  // cliente. El bucket es privado; la RLS permite al cliente ver SOLO las suyas.
  const rutasImg = solicitudes
    .map((s) => s.imagen_url)
    .filter((r): r is string => !!r);
  const firmadas: Record<string, string> = {};
  if (rutasImg.length > 0) {
    const { data: urls } = await supabase.storage
      .from("referencias")
      .createSignedUrls(rutasImg, 3600);
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) firmadas[u.path] = u.signedUrl;
    }
  }

  // Notas (hilo de mensajes con la dueña) de las solicitudes mostradas.
  const notasPorSolicitud: Record<number, Nota[]> = {};
  const ids = solicitudes.map((s) => s.id);
  if (ids.length > 0) {
    const { data: notas } = await supabase
      .from("notas_cotizacion")
      .select("id, presupuesto_id, autor, mensaje, created_at")
      .in("presupuesto_id", ids)
      .order("created_at", { ascending: true })
      .returns<(Nota & { presupuesto_id: number })[]>();
    for (const n of notas ?? []) {
      (notasPorSolicitud[n.presupuesto_id] ??= []).push(n);
    }
  }

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

      {/* Acceso a las confirmadas */}
      <Link
        href="/confirmadas"
        className="aparecer mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-tinta">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-300"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Ver mis compras confirmadas
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-tinta-soft"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* Filtros */}
      <div className="aparecer mb-6 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const activo = f.clave === filtro;
          return (
            <Link
              key={f.clave}
              href={
                f.clave === "todas"
                  ? "/mis-solicitudes"
                  : `/mis-solicitudes?filtro=${f.clave}`
              }
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                activo
                  ? "border-coral bg-coral/15 text-coral-dark"
                  : "border-white/12 bg-white/[0.04] text-tinta-soft hover:border-white/25 hover:text-tinta"
              }`}
            >
              {f.etiqueta}
            </Link>
          );
        })}
      </div>

      {!solicitudes || solicitudes.length === 0 ? (
        <div className="tarjeta aparecer border-dashed p-10 text-center">
          <p className="text-3xl">🛍️</p>
          <p className="mt-3 text-tinta-soft">
            {filtro === "espera"
              ? "No tienes solicitudes en espera de precio."
              : filtro === "cotizadas"
                ? "Aún no tienes solicitudes cotizadas."
                : "Todavía no tienes solicitudes."}
          </p>
          <Link
            href="/cotizar"
            className="mt-4 inline-block font-semibold text-coral-dark hover:underline"
          >
            Pedir una cotización
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
                    <p className="flex flex-wrap items-center gap-2 font-medium text-tinta">
                      {etiquetaPlataforma(s.plataforma)}
                      {s.tipo === "carrito" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-semibold text-coral-dark">
                          🛒 {TIPO_ETIQUETA.carrito}
                        </span>
                      )}
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
                    {s.imagen_url && firmadas[s.imagen_url] && (
                      <a
                        href={firmadas[s.imagen_url]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-2 inline-flex items-center gap-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={firmadas[s.imagen_url]}
                          alt="Imagen de referencia"
                          className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10 transition group-hover:ring-coral/50"
                        />
                        <span className="text-xs font-medium text-coral-dark group-hover:underline">
                          Ver imagen que enviaste
                        </span>
                      </a>
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
                    {puedePagar && s.expira_en && (
                      <div className="mt-3">
                        <ContadorOferta expiraEn={s.expira_en} compacto />
                      </div>
                    )}
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

                {/* Hilo de notas con la dueña (responder o cancelar) */}
                {(notasPorSolicitud[s.id]?.length ?? 0) > 0 && (
                  <NotasCotizacion
                    presupuestoId={s.id}
                    notas={notasPorSolicitud[s.id]}
                    rol="cliente"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
