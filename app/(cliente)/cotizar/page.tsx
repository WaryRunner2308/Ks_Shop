"use client";

import Link from "next/link";
import { useActionState } from "react";
import { crearSolicitud, type EstadoCotizar } from "./actions";
import { PLATAFORMAS } from "@/lib/constantes";

const estadoInicial: EstadoCotizar = {};

export default function CotizarPage() {
  const [estado, accion, enviando] = useActionState(
    crearSolicitud,
    estadoInicial,
  );

  // Mensaje de confirmación tras enviar.
  if (estado.ok) {
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
            Pronto revisaremos tu producto y recibirás el precio. Puedes ver el
            estado de tus solicitudes en cualquier momento.
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
      <header className="mb-8 aparecer">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-coral">
          Paso 1 de 2
        </p>
        <h1 className="font-display text-3xl text-tinta">Pedir una cotización</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Cuéntanos qué quieres y te enviaremos el precio.
        </p>
      </header>

      <form action={accion} className="tarjeta entrada flex flex-col gap-5 p-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">Plataforma</span>
          <select
            name="plataforma"
            required
            defaultValue=""
            className="campo"
          >
            <option value="" disabled>
              Elige una…
            </option>
            {PLATAFORMAS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">
            Link del producto
          </span>
          <input
            type="url"
            name="url_producto"
            required
            placeholder="https://…"
            className="campo"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">
            Variante que quieres
          </span>
          <textarea
            name="variante"
            required
            rows={3}
            placeholder="Ej.: Talla M, color negro"
            className="campo resize-none"
          />
        </label>

        {estado.error && (
          <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
            {estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="btn-coral mt-1 px-4 py-3"
        >
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/mis-solicitudes" className="text-coral-dark hover:underline">
          Ver mis solicitudes
        </Link>
      </p>
    </div>
  );
}
