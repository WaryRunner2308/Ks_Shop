"use client";

import { useActionState, useEffect, useState } from "react";
import {
  crearMetodo,
  actualizarMetodo,
  type EstadoMetodo,
} from "./actions";
import { TIPOS_METODO, configTipo } from "@/lib/metodos-pago";

const estadoInicial: EstadoMetodo = {};

type Props = {
  // Si viene "metodo", el formulario está en modo edición.
  metodo?: { id: number; tipo: string; detalles: Record<string, string> };
  onListo?: () => void;
};

const claseInput = "campo py-2";

export default function FormularioMetodo({ metodo, onListo }: Props) {
  const editando = !!metodo;
  const [estado, accion, enviando] = useActionState(
    editando ? actualizarMetodo : crearMetodo,
    estadoInicial,
  );
  const [tipo, setTipo] = useState(metodo?.tipo ?? "");
  const config = configTipo(tipo);

  // Al guardar con éxito en modo edición, cerramos el formulario.
  useEffect(() => {
    if (estado.ok && editando) onListo?.();
  }, [estado.ok, editando, onListo]);

  return (
    <form
      action={accion}
      className="flex flex-col gap-3 rounded-xl border border-linea bg-white p-4"
    >
      {editando && <input type="hidden" name="id" value={metodo.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Tipo de método</span>
        {editando ? (
          // En edición el tipo no cambia (se mantiene fijo).
          <input type="hidden" name="tipo" value={tipo} />
        ) : null}
        <select
          name={editando ? undefined : "tipo"}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          disabled={editando}
          required
          className={`${claseInput} disabled:opacity-70`}
        >
          <option value="" disabled>
            Elige un tipo…
          </option>
          {TIPOS_METODO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </label>

      {/* Campos dinámicos según el tipo elegido */}
      {config?.campos.map((campo) => (
        <label key={campo.nombre} className="flex flex-col gap-1">
          <span className="text-sm font-medium text-tinta">
            {campo.etiqueta}
            {campo.requerido && <span className="text-coral"> *</span>}
          </span>
          <input
            type="text"
            name={campo.nombre}
            defaultValue={metodo?.detalles?.[campo.nombre] ?? ""}
            required={campo.requerido}
            className={claseInput}
          />
        </label>
      ))}

      {estado.error && (
        <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral-dark">
          {estado.error}
        </p>
      )}
      {estado.ok && !editando && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Método guardado.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando || !tipo}
          className="btn-coral px-4 py-2 text-sm"
        >
          {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Agregar método"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={onListo}
            className="btn-linea px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
