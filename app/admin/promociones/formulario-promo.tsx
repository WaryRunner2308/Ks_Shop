"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearPromocion, type EstadoPromo } from "./actions";

const estadoInicial: EstadoPromo = {};

export default function FormularioPromo() {
  const [estado, accion, enviando] = useActionState(
    crearPromocion,
    estadoInicial,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Al publicar con éxito, limpiamos el formulario.
  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset();
      setPreview(null);
    }
  }, [estado.ok]);

  return (
    <form ref={formRef} action={accion} className="tarjeta flex flex-col gap-4 p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">Título</span>
        <input
          type="text"
          name="titulo"
          required
          maxLength={120}
          placeholder="Ej.: 20% en envíos esta semana"
          className="campo"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">Descripción</span>
        <textarea
          name="descripcion"
          required
          rows={3}
          placeholder="Cuenta de qué trata la promoción…"
          className="campo resize-none"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Imagen{" "}
          <span className="font-normal text-tinta-soft">(opcional)</span>
        </span>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-3 transition hover:border-coral/50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa"
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-tinta-soft">
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
            {preview ? "Toca para cambiar la imagen" : "Subir imagen"}
          </span>
          <input
            type="file"
            name="imagen"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
            className="hidden"
          />
        </label>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/[0.08] px-3.5 py-3 text-xs leading-relaxed text-tinta">
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
          <path d="M12 2a3 3 0 0 0-3 3v.4A7 7 0 0 0 5 12v3l-1.5 3h17L19 15v-3a7 7 0 0 0-4-6.6V5a3 3 0 0 0-3-3Z" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        <span>
          Al publicar, se envía una notificación push a{" "}
          <strong className="font-semibold">todos tus clientes</strong>.
        </span>
      </p>

      {estado.error && (
        <p className="deslizar-entra rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-dark">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="deslizar-entra rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          ¡Promoción publicada y enviada a tus clientes!
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="btn-coral px-4 py-3.5"
      >
        {enviando ? "Publicando…" : "Publicar y notificar"}
      </button>
    </form>
  );
}
