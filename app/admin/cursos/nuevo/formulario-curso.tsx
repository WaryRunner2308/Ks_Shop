"use client";

import { useActionState, useState } from "react";
import { crearCurso, type EstadoCurso } from "../actions";

const estadoInicial: EstadoCurso = {};

// Selector de imagen con vista previa. El <input file> va oculto, así que NO
// usamos `required` (rompería el submit); la foto es opcional.
function SelectorImagen({ name }: { name: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-[#180516] p-3 transition hover:border-coral/50">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Vista previa"
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#20091c] text-tinta-soft">
          <svg
            width="24"
            height="24"
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
        {preview ? "Toca para cambiar la foto" : "Subir foto del curso"}
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

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Foto del curso{" "}
          <span className="font-normal text-tinta-soft">(opcional)</span>
        </span>
        <SelectorImagen name="imagen" />
      </div>

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
        <div className="campo flex items-center gap-1.5 focus-within:border-coral/70">
          <span className="select-none text-tinta-soft">$</span>
          <input
            type="number"
            name="precio"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className="w-full border-0 bg-transparent p-0 text-tinta outline-none placeholder:text-tinta-soft/50"
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
