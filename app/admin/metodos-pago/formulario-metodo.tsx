"use client";

import { useActionState, useEffect, useState } from "react";
import {
  crearMetodo,
  actualizarMetodo,
  type EstadoMetodo,
} from "./actions";
import { TIPOS_METODO, configTipo, textoRecargo } from "@/lib/metodos-pago";
import SelectorPlataforma from "@/app/components/selector-plataforma";

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
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#180516] p-4"
    >
      {editando && <input type="hidden" name="id" value={metodo.id} />}

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-tinta">Tipo de método</span>
        {/* Selector personalizado (mismo visual que el del lado cliente). En
            edición el tipo queda fijo (disabled), pero igual envía "tipo". */}
        <SelectorPlataforma
          name="tipo"
          opciones={TIPOS_METODO}
          placeholder="Elige un tipo…"
          value={tipo}
          onChange={setTipo}
          disabled={editando}
        />
      </div>

      {/* Nota de comisión / caso especial */}
      {config && textoRecargo(config.valor) && (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-300">
          {textoRecargo(config.valor)} — se suma automáticamente al monto del
          cliente.
        </p>
      )}
      {config?.sinConfig && (
        <p className="rounded-lg border border-white/10 bg-[#180516] px-3 py-2 text-xs text-tinta-soft">
          No requiere datos de cuenta. El cliente coordina la entrega o depósito
          contigo por WhatsApp.
        </p>
      )}

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
        <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-sm text-emerald-300">
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
