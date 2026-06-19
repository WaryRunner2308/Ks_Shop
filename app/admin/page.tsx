import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_ETIQUETA, etiquetaPlataforma, TIPO_ETIQUETA } from "@/lib/constantes";
import FormularioPrecio from "./formulario-precio";
import NotasCotizacion, { type Nota } from "@/app/components/notas-cotizacion";

type Cliente = { nombre: string | null; email: string | null };

type Solicitud = {
  id: number;
  plataforma: string;
  url_producto: string;
  variante: string | null;
  precio_venta: number | null;
  estado: string;
  created_at: string;
  imagen_url: string | null;
  archivada_admin: boolean | null;
  tipo: string;
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
  pagado: "bg-green-950/60 text-green-400",
  confirmado: "bg-green-950/60 text-green-400",
  cancelado: "bg-tinta/10 text-tinta-soft",
};

function Tarjeta({
  s,
  imagenUrl,
  notas = [],
}: {
  s: Solicitud;
  imagenUrl?: string | null;
  notas?: Nota[];
}) {
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
            {s.tipo === "carrito" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-semibold text-coral-dark">
                {TIPO_ETIQUETA.carrito}
              </span>
            )}
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
          {imagenUrl && (
            <a
              href={imagenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-2 inline-flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenUrl}
                alt="Imagen de referencia"
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10 transition group-hover:ring-coral/50"
              />
              <span className="text-xs font-medium text-coral-dark group-hover:underline">
                Ver imagen de referencia
              </span>
            </a>
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
        <>
          <FormularioPrecio id={s.id} />
          <NotasCotizacion presupuestoId={s.id} notas={notas} rol="admin" />
        </>
      ) : (
        s.precio_venta != null && (
          <div className="mt-3 rounded-xl bg-[#20091c] px-4 py-2.5 text-sm text-tinta-soft">
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

// Tarjetita de resumen (contador rápido del estado del negocio). Al tocarla
// desplaza a la sección correspondiente (href tipo "#pendientes").
function Resumen({
  valor,
  etiqueta,
  destacado = false,
  href,
}: {
  valor: number;
  etiqueta: string;
  destacado?: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`tarjeta tarjeta-flota block p-4 text-center sm:p-5 ${
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
    </a>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  // RLS permite al admin leer TODAS las solicitudes. Se incluye el nombre/correo
  // del cliente que la pidió.
  const { data } = await supabase
    .from("presupuestos")
    .select(
      "id, plataforma, url_producto, variante, precio_venta, estado, created_at, imagen_url, archivada_admin, tipo, usuarios(nombre, email)",
    )
    .order("created_at", { ascending: false })
    .returns<Solicitud[]>();

  const solicitudes = data ?? [];
  const pendientes = solicitudes.filter((s) => s.estado === "solicitado");

  // Notas (hilo de mensajes) de las solicitudes pendientes, agrupadas por id.
  const notasPorSolicitud: Record<number, Nota[]> = {};
  const idsPendientes = pendientes.map((s) => s.id);
  if (idsPendientes.length > 0) {
    const { data: notas } = await supabase
      .from("notas_cotizacion")
      .select("id, presupuesto_id, autor, mensaje, created_at")
      .in("presupuesto_id", idsPendientes)
      .order("created_at", { ascending: true })
      .returns<(Nota & { presupuesto_id: number })[]>();
    for (const n of notas ?? []) {
      (notasPorSolicitud[n.presupuesto_id] ??= []).push(n);
    }
  }
  // "Ya cotizadas" = activas (cotizada o pagada esperando confirmar). Las
  // confirmadas salen del panel y van a su propia página.
  const cotizadas = solicitudes.filter(
    (s) => s.estado === "cotizado" || s.estado === "pagado",
  );
  const confirmadasCount = solicitudes.filter(
    (s) => s.estado === "confirmado" && !s.archivada_admin,
  ).length;

  // Pagos que el cliente ya registró y faltan por confirmar.
  const { count: pagosPorConfirmar } = await supabase
    .from("pagos")
    .select("id", { count: "exact", head: true })
    .eq("estado", "registrado");

  // URLs firmadas (temporales) para ver las imágenes de referencia del bucket
  // privado. Solo para las solicitudes que traen imagen.
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
  const urlDe = (s: Solicitud) =>
    s.imagen_url ? firmadas[s.imagen_url] : undefined;

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
        <Resumen
          valor={pendientes.length}
          etiqueta="Pendientes"
          destacado
          href="#pendientes"
        />
        <Resumen
          valor={cotizadas.length}
          etiqueta="Cotizadas"
          href="#cotizadas"
        />
        <Resumen
          valor={confirmadasCount}
          etiqueta="Confirmadas"
          href="/admin/confirmadas"
        />
      </section>

      {/* Botón destacado: pagos que faltan por confirmar */}
      <Link
        href="/admin/pagos"
        className="entrada mb-4 flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/10 px-5 py-4 transition hover:border-coral hover:bg-coral/15"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/20 text-coral-dark">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-tinta">Pagos por confirmar</p>
            <p className="text-xs text-tinta-soft">
              Revisa los comprobantes y confirma cada pago.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-2">
          {pagosPorConfirmar ? (
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-coral px-2 text-sm font-bold text-white">
              {pagosPorConfirmar}
            </span>
          ) : null}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-coral-dark"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </Link>

      {/* Accesos rápidos */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/clientes" className="btn-linea px-4 py-2 text-sm">
          Clientes
        </Link>
        <Link
          href="/admin/metodos-pago"
          className="btn-linea px-4 py-2 text-sm"
        >
          Métodos de pago
        </Link>
        <Link href="/admin/tutoriales" className="btn-linea px-4 py-2 text-sm">
          Tutoriales
        </Link>
        <Link href="/admin/promociones" className="btn-linea px-4 py-2 text-sm">
          Promociones
        </Link>
      </div>

      <div className="mb-10" />

      {/* Pendientes primero: lo que falta responder */}
      <section id="pendientes" className="mb-10 scroll-mt-24">
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
              <Tarjeta
                key={s.id}
                s={s}
                imagenUrl={urlDe(s)}
                notas={notasPorSolicitud[s.id] ?? []}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Ya cotizadas */}
      <section id="cotizadas" className="scroll-mt-24">
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
              <Tarjeta key={s.id} s={s} imagenUrl={urlDe(s)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
