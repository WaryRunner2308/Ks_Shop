"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATAFORMAS } from "@/lib/constantes";

/*
  Sección "Plataformas" del inicio del cliente. Muestra las marcas y un botón
  "Más" que revela que también se compra en otras tiendas (las que se piden con
  la opción "Otra" al cotizar). Las marcas salen de PLATAFORMAS (no hardcodeadas).
*/
export default function PlataformasCliente() {
  const [abierto, setAbierto] = useState(false);

  return (
    <section className="mt-12">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-tinta-soft">
        Plataformas
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        {PLATAFORMAS.map((p) => (
          <span
            key={p.valor}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-tinta-soft"
          >
            {p.etiqueta}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="inline-flex items-center gap-1 rounded-full border border-coral/40 bg-coral/10 px-3.5 py-1.5 text-xs font-semibold text-coral-dark transition hover:bg-coral/20"
        >
          {abierto ? "Menos" : "Más"}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {abierto ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
          </svg>
        </button>
      </div>

      {abierto && (
        <div className="deslizar-entra mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-tinta-soft">
          ¿No ves tu tienda? También compramos en otras. Al pedir tu cotización,
          elige <span className="font-semibold text-tinta">“Otra”</span> en la
          plataforma.{" "}
          <Link
            href="/cotizar"
            className="font-semibold text-coral-dark hover:underline"
          >
            Pedir cotización
          </Link>
        </div>
      )}
    </section>
  );
}
