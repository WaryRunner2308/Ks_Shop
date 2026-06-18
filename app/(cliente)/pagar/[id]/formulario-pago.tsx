"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarPago, type EstadoPago } from "./actions";
import { DISCLAIMER_ENVIO } from "@/lib/constantes";
import { configTipo, etiquetaTipo } from "@/lib/metodos-pago";

type Metodo = {
  id: number;
  tipo: string;
  detalles: Record<string, string>;
};

type Props = {
  presupuestoId: number;
  precio: number;
  metodos: Metodo[];
};

const estadoInicial: EstadoPago = {};

export default function FormularioPago({
  presupuestoId,
  precio,
  metodos,
}: Props) {
  const [estado, accion, enviando] = useActionState(
    registrarPago,
    estadoInicial,
  );

  if (estado.ok) {
    return (
      <div className="rounded-2xl border border-linea bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/15 text-2xl">
          ✓
        </div>
        <h1 className="font-display text-2xl text-tinta">¡Pago registrado!</h1>
        <p className="mt-3 text-sm leading-relaxed text-tinta-soft">
          Recibimos tu comprobante. Lo verificaremos y te confirmaremos pronto.
        </p>
        <Link
          href="/mis-solicitudes"
          className="mt-6 inline-block rounded-xl bg-coral px-6 py-3 font-semibold text-white transition hover:bg-coral-dark"
        >
          Ver mis solicitudes
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-6">
      <input type="hidden" name="presupuesto_id" value={presupuestoId} />

      {/* Monto a pagar */}
      <div className="rounded-2xl border border-linea bg-white p-5">
        <p className="text-sm text-tinta-soft">Monto a pagar</p>
        <p className="font-display text-3xl text-tinta">
          ${precio.toFixed(2)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-tinta-soft">
          {DISCLAIMER_ENVIO}
        </p>
      </div>

      {/* Métodos de pago */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-tinta">
          Elige a dónde pagar
        </legend>

        {metodos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-linea bg-white p-4 text-sm text-tinta-soft">
            La tienda aún no tiene métodos de pago disponibles. Intenta más
            tarde.
          </p>
        ) : (
          metodos.map((m) => {
            const config = configTipo(m.tipo);
            return (
              <label
                key={m.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-linea bg-white p-4 hover:border-coral"
              >
                <input
                  type="radio"
                  name="metodo_pago_id"
                  value={m.id}
                  className="mt-1 accent-coral"
                />
                <div>
                  <p className="font-medium text-tinta">
                    {etiquetaTipo(m.tipo)}
                  </p>
                  <dl className="mt-1 text-sm text-tinta-soft">
                    {config?.campos.map((campo) => {
                      const valor = m.detalles?.[campo.nombre];
                      if (!valor) return null;
                      return (
                        <div key={campo.nombre} className="flex gap-1">
                          <dt>{campo.etiqueta}:</dt>
                          <dd className="text-tinta">{valor}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </label>
            );
          })
        )}
      </fieldset>

      {/* Comprobante */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Sube tu comprobante (imagen)
        </span>
        <input
          type="file"
          name="comprobante"
          accept="image/*"
          required
          className="rounded-xl border border-linea bg-white px-4 py-3 text-sm text-tinta file:mr-3 file:rounded-lg file:border-0 file:bg-crema-2 file:px-3 file:py-1.5 file:text-tinta"
        />
      </label>

      {estado.error && (
        <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || metodos.length === 0}
        className="rounded-xl bg-coral px-4 py-3 font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
      >
        {enviando ? "Registrando…" : "Registrar pago"}
      </button>
    </form>
  );
}
