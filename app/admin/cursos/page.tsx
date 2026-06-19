import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { etiquetaTipo } from "@/lib/metodos-pago";
import {
  eliminarCurso,
  aprobarPagoCurso,
  rechazarPagoCurso,
} from "./actions";

type Curso = {
  id: number;
  nombre: string;
  precio: number;
  publicado: boolean;
  created_at: string;
};

type PagoCurso = {
  id: number;
  monto_declarado: number | null;
  estado: string;
  comprobante_url: string | null;
  created_at: string;
  usuarios: { nombre: string | null; email: string | null } | null;
  cursos: { nombre: string } | null;
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

function TarjetaPago({
  pago,
  urlComprobante,
}: {
  pago: PagoCurso;
  urlComprobante: string | null;
}) {
  const cliente = pago.usuarios?.nombre || pago.usuarios?.email || "Cliente";
  const pendiente = pago.estado === "registrado";

  return (
    <li className={`tarjeta tarjeta-flota p-5 ${pendiente ? "border-coral/30" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-tinta">{cliente}</p>
          <p className="text-sm text-tinta-soft">
            Curso: {pago.cursos?.nombre ?? "—"}
          </p>
          <p className="mt-1 text-xs text-tinta-soft">
            {formatearFecha(pago.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl text-coral-dark">
            ${Number(pago.monto_declarado ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-tinta-soft">
            {pago.metodos_pago
              ? etiquetaTipo(pago.metodos_pago.tipo)
              : "Método eliminado"}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              pago.estado === "verificado"
                ? "bg-green-100 text-green-700"
                : pago.estado === "rechazado"
                  ? "bg-coral/15 text-coral-dark"
                  : "bg-crema-2 text-tinta"
            }`}
          >
            {ESTADO_PAGO_ETIQUETA[pago.estado] ?? pago.estado}
          </span>
        </div>
      </div>

      <div className="mt-4">
        {urlComprobante ? (
          <a
            href={urlComprobante}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-fit overflow-hidden rounded-xl border border-linea"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlComprobante}
              alt="Comprobante de pago"
              className="max-h-64 object-contain transition duration-300 group-hover:scale-[1.03]"
            />
          </a>
        ) : (
          <p className="text-sm text-tinta-soft">Sin comprobante.</p>
        )}
      </div>

      {pendiente && (
        <div className="mt-4 flex gap-2">
          <form action={aprobarPagoCurso}>
            <input type="hidden" name="id" value={pago.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
            >
              ✓ Confirmar pago
            </button>
          </form>
          <form action={rechazarPagoCurso}>
            <input type="hidden" name="id" value={pago.id} />
            <button
              type="submit"
              className="rounded-xl border border-coral/40 px-4 py-2 text-sm font-semibold text-coral-dark transition hover:-translate-y-0.5 hover:bg-coral/10 active:translate-y-0"
            >
              Rechazar pago
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default async function AdminCursosPage() {
  const supabase = await createClient();

  const { data: cursosData } = await supabase
    .from("cursos")
    .select("id, nombre, precio, publicado, created_at")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Curso[]>();
  const cursos = cursosData ?? [];

  const { data: pagosData } = await supabase
    .from("cursos_pagos")
    .select(
      "id, monto_declarado, estado, comprobante_url, created_at, usuarios(nombre, email), cursos(nombre), metodos_pago(tipo)",
    )
    .order("created_at", { ascending: false })
    .returns<PagoCurso[]>();
  const pagos = pagosData ?? [];

  // URLs firmadas para los comprobantes (bucket privado).
  const rutas = pagos
    .map((p) => p.comprobante_url)
    .filter((r): r is string => !!r);
  const urlPorRuta = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage
      .from("comprobantes")
      .createSignedUrls(rutas, 3600);
    firmadas?.forEach((f) => {
      if (f.signedUrl && f.path) urlPorRuta.set(f.path, f.signedUrl);
    });
  }

  const pagosPendientes = pagos.filter((p) => p.estado === "registrado");
  const pagosRevisados = pagos.filter((p) => p.estado !== "registrado");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 aparecer">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[#1c0618] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
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
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-tinta">Cursos</h1>
          <Link
            href="/admin/cursos/nuevo"
            className="btn-coral shrink-0 px-4 py-2.5 text-sm"
          >
            Nuevo
          </Link>
        </div>
        <p className="mt-2 text-sm text-tinta-soft">
          Cursos de pago que verán tus clientes.
        </p>
      </header>

      {/* Lista de cursos */}
      <section className="mb-12">
        {cursos.length === 0 ? (
          <p className="tarjeta border-dashed p-6 text-sm text-tinta-soft">
            Aún no has creado cursos.
          </p>
        ) : (
          <ul className="entrada flex flex-col gap-3">
            {cursos.map((c) => (
              <li
                key={c.id}
                className="tarjeta tarjeta-flota flex items-center gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-tinta">{c.nombre}</p>
                  <p className="text-sm font-semibold text-coral-dark">
                    ${Number(c.precio).toFixed(2)}
                  </p>
                </div>
                <form action={eliminarCurso}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-tinta-soft transition hover:bg-[#20091c] hover:text-coral-dark"
                  >
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pagos de cursos por confirmar */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tinta">
          Pagos por confirmar
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-2 text-xs font-bold text-white">
            {pagosPendientes.length}
          </span>
        </h2>
        {pagosPendientes.length === 0 ? (
          <p className="tarjeta border-dashed p-6 text-sm text-tinta-soft">
            No hay pagos de cursos por confirmar.
          </p>
        ) : (
          <ul className="entrada flex flex-col gap-4">
            {pagosPendientes.map((p) => (
              <TarjetaPago
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

      {pagosRevisados.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-tinta">
            Ya revisados{" "}
            <span className="text-tinta-soft">({pagosRevisados.length})</span>
          </h2>
          <ul className="entrada flex flex-col gap-4">
            {pagosRevisados.map((p) => (
              <TarjetaPago
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
        </section>
      )}
    </div>
  );
}
