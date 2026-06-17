"use client";

import { useState } from "react";
import { alternarActivo, eliminarMetodo } from "./actions";
import { configTipo, etiquetaTipo } from "@/lib/metodos-pago";
import FormularioMetodo from "./formulario-metodo";

type Metodo = {
  id: number;
  tipo: string;
  detalles: Record<string, string>;
  activo: boolean;
};

export default function FilaMetodo({ metodo }: { metodo: Metodo }) {
  const [editando, setEditando] = useState(false);
  const config = configTipo(metodo.tipo);

  if (editando) {
    return (
      <li>
        <FormularioMetodo metodo={metodo} onListo={() => setEditando(false)} />
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-linea bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-tinta">
              {etiquetaTipo(metodo.tipo)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                metodo.activo
                  ? "bg-green-100 text-green-700"
                  : "bg-crema-2 text-tinta-soft"
              }`}
            >
              {metodo.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          {/* Detalles guardados */}
          <dl className="mt-2 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
            {config?.campos.map((campo) => {
              const valor = metodo.detalles?.[campo.nombre];
              if (!valor) return null;
              return (
                <div key={campo.nombre} className="flex gap-1">
                  <dt className="text-tinta-soft">{campo.etiqueta}:</dt>
                  <dd className="text-tinta">{valor}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="rounded-lg border border-linea px-3 py-1.5 text-sm font-medium text-tinta transition hover:bg-crema-2"
        >
          Editar
        </button>

        <form action={alternarActivo}>
          <input type="hidden" name="id" value={metodo.id} />
          <input type="hidden" name="activo" value={(!metodo.activo).toString()} />
          <button
            type="submit"
            className="rounded-lg border border-linea px-3 py-1.5 text-sm font-medium text-tinta transition hover:bg-crema-2"
          >
            {metodo.activo ? "Desactivar" : "Activar"}
          </button>
        </form>

        <form action={eliminarMetodo}>
          <input type="hidden" name="id" value={metodo.id} />
          <button
            type="submit"
            className="rounded-lg border border-coral/40 px-3 py-1.5 text-sm font-medium text-coral-dark transition hover:bg-coral/10"
          >
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}
