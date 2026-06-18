"use client";

import Link from "next/link";
import { useActionState } from "react";
import { crearSolicitud, type EstadoCotizar } from "./actions";
import { PLATAFORMAS } from "@/lib/constantes";
import SelectorPlataforma from "@/app/components/selector-plataforma";

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

      <form action={accion} className="tarjeta entrada flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">Plataforma</span>
          <SelectorPlataforma name="plataforma" opciones={PLATAFORMAS} />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">
            Link del producto
          </span>
          <input
            type="url"
            name="url_producto"
            required
            inputMode="url"
            placeholder="https://…"
            className="campo"
          />
          <span className="text-xs text-tinta-soft">
            Pega el enlace exacto del producto que quieres.
          </span>
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
          <span className="text-xs text-tinta-soft">
            Indica talla, color o el modelo específico.
          </span>
        </label>

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
          {enviando ? "Enviando…" : "Enviar solicitud"}
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

      <p className="mt-6 text-center text-sm">
        <Link href="/mis-solicitudes" className="text-coral-dark hover:underline">
          Ver mis solicitudes
        </Link>
      </p>
    </div>
  );
}
