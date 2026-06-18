"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { crearSolicitud, type EstadoCotizar } from "./actions";
import { PLATAFORMAS } from "@/lib/constantes";
import SelectorPlataforma from "@/app/components/selector-plataforma";

const estadoInicial: EstadoCotizar = {};

// ── Un bloque de producto (plataforma + link + variante + imagen opcional) ────
function BloqueProducto({
  indice,
  numero,
  removible,
  onQuitar,
}: {
  indice: number;
  numero: number;
  removible: boolean;
  onQuitar: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  function alElegirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  return (
    <div className="tarjeta flex flex-col gap-4 p-5">
      {removible && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-tinta-soft">
            Producto {numero}
          </span>
          <button
            type="button"
            onClick={onQuitar}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-tinta-soft transition hover:bg-white/[0.06] hover:text-coral-dark"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Quitar
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">Plataforma</span>
        <SelectorPlataforma name={`plataforma_${indice}`} opciones={PLATAFORMAS} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">Link del producto</span>
        <input
          type="url"
          name={`url_${indice}`}
          required
          inputMode="url"
          placeholder="https://…"
          className="campo"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Variante que quieres
        </span>
        <textarea
          name={`variante_${indice}`}
          required
          rows={2}
          placeholder="Ej.: Talla M, color negro"
          className="campo resize-none"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Imagen de referencia{" "}
          <span className="font-normal text-tinta-soft">(opcional)</span>
        </span>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-3 transition hover:border-coral/50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa"
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-tinta-soft">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 20" />
              </svg>
            </span>
          )}
          <span className="text-sm text-tinta-soft">
            {preview ? "Toca para cambiar la imagen" : "Sube una foto (ej. el color exacto)"}
          </span>
          <input
            type="file"
            name={`imagen_${indice}`}
            accept="image/*"
            onChange={alElegirImagen}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

export default function CotizarPage() {
  const [estado, accion, enviando] = useActionState(
    crearSolicitud,
    estadoInicial,
  );
  const [ids, setIds] = useState<number[]>([0]);
  const siguiente = useRef(1);

  function agregar() {
    setIds((prev) => [...prev, siguiente.current++]);
  }
  function quitar(id: number) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  // Mensaje de confirmación tras enviar.
  if (estado.ok) {
    const n = estado.cantidad ?? 1;
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="tarjeta aparecer p-8 text-center">
          <div className="estallar mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-coral/15 text-3xl text-coral-dark">
            ✓
          </div>
          <h1 className="font-display text-2xl text-tinta">
            ¡Solicitud recibida!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-tinta-soft">
            {n > 1
              ? `Recibimos tus ${n} productos. Pronto revisaremos y recibirás el precio de cada uno.`
              : "Pronto revisaremos tu producto y recibirás el precio."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/mis-solicitudes" className="btn-coral px-5 py-3">
              Ver mis solicitudes
            </Link>
            <Link href="/cotizar" className="btn-linea px-5 py-3">
              Pedir otra
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
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

      <header className="mb-8 aparecer">
        <p className="chip mb-4 px-4 py-1.5 text-xs uppercase tracking-[0.2em]">
          <span className="h-1.5 w-1.5 rounded-full bg-coral latido" />
          Paso 1 de 2
        </p>
        <h1 className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
          Pedir una <span className="italic texto-fucsia">cotización</span>
        </h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Cuéntanos qué quieres y te enviaremos el precio.
        </p>
      </header>

      <form action={accion} className="entrada flex flex-col gap-4">
        <input type="hidden" name="cantidad" value={ids.length} />

        {ids.map((id, i) => (
          <BloqueProducto
            key={id}
            indice={i}
            numero={i + 1}
            removible={ids.length > 1}
            onQuitar={() => quitar(id)}
          />
        ))}

        {/* ¿Quieres cotizar algo más? */}
        <button
          type="button"
          onClick={agregar}
          className="btn-linea justify-center px-4 py-3 text-sm"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          ¿Quieres cotizar algo más?
        </button>

        {estado.error && (
          <p className="deslizar-entra rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-dark">
            {estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="btn-coral mt-1 px-4 py-3.5"
        >
          {enviando
            ? "Enviando…"
            : ids.length > 1
              ? `Enviar ${ids.length} solicitudes`
              : "Enviar solicitud"}
        </button>

        <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-xs leading-relaxed text-tinta-soft">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-coral-dark"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          El precio del envío internacional final se notificará una vez que el
          paquete llegue al país.
        </p>
      </form>
    </div>
  );
}
