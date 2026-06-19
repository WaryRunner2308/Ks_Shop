"use client";

import { useActionState } from "react";
import { crearCurso, type EstadoCurso } from "../actions";

const estadoInicial: EstadoCurso = {};

export default function FormularioCurso() {
  const [estado, accion, enviando] = useActionState(crearCurso, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">Nombre del curso</span>
        <input
          type="text"
          name="nombre"
          required
          maxLength={120}
          placeholder="Ej.: Curso de maquillaje profesional"
          className="campo"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Descripción del curso
        </span>
        <textarea
          name="descripcion"
          required
          rows={6}
          placeholder="Cuenta de qué trata el curso, qué incluye, a quién va dirigido…"
          className="campo resize-y"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">Precio (USD)</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tinta-soft">
            $
          </span>
          <input
            type="number"
            name="precio"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className="campo pl-8"
          />
        </div>
      </label>

      {estado.error && (
        <p className="deslizar-entra rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-dark">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="btn-coral px-4 py-3.5"
      >
        {enviando ? "Publicando…" : "Publicar curso"}
      </button>
    </form>
  );
}
