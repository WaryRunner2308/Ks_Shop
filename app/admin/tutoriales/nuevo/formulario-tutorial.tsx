"use client";

import { useActionState, useRef, useState } from "react";
import { crearTutorial, type EstadoTutorial } from "../actions";

const estadoInicial: EstadoTutorial = {};

// Campo de imagen con vista previa (portada o imagen de un paso).
// Nota: el <input file> va oculto, así que NO usamos `required` (rompería el
// submit con "control not focusable"); la obligatoriedad se valida en el servidor.
function SelectorImagen({
  name,
  texto = "Subir imagen",
}: {
  name: string;
  texto?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-[#180516] p-3 transition hover:border-coral/50">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Vista previa"
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#20091c] text-tinta-soft">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 20" />
          </svg>
        </span>
      )}
      <span className="text-sm text-tinta-soft">
        {preview ? "Toca para cambiar la imagen" : texto}
      </span>
      <input
        type="file"
        name={name}
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
        className="hidden"
      />
    </label>
  );
}

function PasoBloque({
  indice,
  numero,
  removible,
  onQuitar,
}: {
  indice: number;
  numero: number;
  removible: boolean;
  onQuitar: () => void;
}) {
  return (
    <div className="tarjeta flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-tinta-soft">
          Paso {numero}
        </span>
        {removible && (
          <button
            type="button"
            onClick={onQuitar}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-tinta-soft transition hover:bg-[#20091c] hover:text-coral-dark"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Quitar
          </button>
        )}
      </div>

      <textarea
        name={`descripcion_${indice}`}
        required
        rows={2}
        placeholder="Describe este paso…"
        className="campo resize-none"
      />
      <SelectorImagen
        name={`imagen_${indice}`}
        texto="Imagen del paso (opcional)"
      />
    </div>
  );
}

export default function FormularioTutorial() {
  const [estado, accion, enviando] = useActionState(
    crearTutorial,
    estadoInicial,
  );
  const [ids, setIds] = useState<number[]>([0]);
  const siguiente = useRef(1);

  return (
    <form action={accion} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Título del tutorial
        </span>
        <input
          type="text"
          name="titulo"
          required
          maxLength={120}
          placeholder="Ej.: Cómo compartir el link de Shein"
          className="campo"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Imagen de portada
        </span>
        <SelectorImagen name="portada" texto="Subir portada" />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-tinta">Pasos</span>
        <input type="hidden" name="pasos" value={ids.length} />
        {ids.map((id, i) => (
          <PasoBloque
            key={id}
            indice={i}
            numero={i + 1}
            removible={ids.length > 1}
            onQuitar={() => setIds((prev) => prev.filter((x) => x !== id))}
          />
        ))}
        <button
          type="button"
          onClick={() => setIds((prev) => [...prev, siguiente.current++])}
          className="btn-linea justify-center px-4 py-3 text-sm"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar paso
        </button>
      </div>

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
        {enviando ? "Publicando…" : "Publicar tutorial"}
      </button>
    </form>
  );
}
