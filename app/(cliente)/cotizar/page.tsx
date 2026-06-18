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
        <div className="rounded-2xl border border-linea bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/15 text-2xl">
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
            <Link
              href="/mis-solicitudes"
              className="rounded-xl bg-coral px-5 py-3 font-semibold text-white transition hover:bg-coral-dark"
            >
              Ver mis solicitudes
            </Link>
            <Link
              href="/cotizar"
              className="rounded-xl border border-linea px-5 py-3 font-medium text-tinta transition hover:bg-crema-2"
            >
              Pedir otra
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-tinta">Pedir una cotización</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Cuéntanos qué quieres y te enviaremos el precio.
        </p>
      </header>

      <form action={accion} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">Plataforma</span>
          <select
            name="plataforma"
            required
            defaultValue=""
            className="rounded-xl border border-linea bg-white px-4 py-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
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
            className="rounded-xl border border-linea bg-white px-4 py-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
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
            className="resize-none rounded-xl border border-linea bg-white px-4 py-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
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
          className="mt-1 rounded-xl bg-coral px-4 py-3 font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
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
