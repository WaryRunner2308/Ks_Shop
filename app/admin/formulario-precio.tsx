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
            className="campo w-32 py-2 pl-7 pr-3"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="btn-coral px-4 py-2 text-sm"
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
