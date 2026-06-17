"use client";

import { useActionState } from "react";
import { enviarPrecio, type EstadoPrecio } from "./actions";

const estadoInicial: EstadoPrecio = {};

// Formulario por fila: la dueña escribe el precio de venta y lo envía al cliente.
export default function FormularioPrecio({ id }: { id: number }) {
  const [estado, accion, enviando] = useActionState(
    enviarPrecio,
    estadoInicial,
  );

  return (
    <form action={accion} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-soft">
            $
          </span>
          <input
            type="number"
            name="precio_venta"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="w-32 rounded-lg border border-linea bg-white py-2 pl-7 pr-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar precio al cliente"}
        </button>
      </div>
      {estado.error && (
        <p className="text-sm text-coral-dark">{estado.error}</p>
      )}
    </form>
  );
}
