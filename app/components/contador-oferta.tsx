"use client";

import { useEffect, useState } from "react";

// Cuenta regresiva hasta que vence la oferta (12h). Crea urgencia y, al llegar
// a cero, avisa que el precio venció.

function restante(objetivo: number): number {
  const ms = objetivo - Date.now();
  return ms > 0 ? ms : 0;
}

function formatear(ms: number): string {
  const seg = Math.floor(ms / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function ContadorOferta({
  expiraEn,
  compacto = false,
}: {
  expiraEn: string;
  compacto?: boolean;
}) {
  const objetivo = new Date(expiraEn).getTime();
  const [ms, setMs] = useState(() => restante(objetivo));

  useEffect(() => {
    setMs(restante(objetivo));
    const t = setInterval(() => setMs(restante(objetivo)), 1000);
    return () => clearInterval(t);
  }, [objetivo]);

  const vencido = ms <= 0;
  // Urgente cuando queda menos de 1 hora.
  const urgente = !vencido && ms < 60 * 60 * 1000;

  if (compacto) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          vencido
            ? "bg-white/8 text-tinta-soft"
            : urgente
              ? "bg-coral/15 text-coral-dark"
              : "bg-amber-400/12 text-amber-300"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {vencido ? "Oferta vencida" : formatear(ms)}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${
        vencido
          ? "border-white/10 bg-[#180516] text-tinta-soft"
          : urgente
            ? "border-coral/30 bg-coral/10 text-coral-dark"
            : "border-amber-400/20 bg-amber-400/[0.07] text-amber-300"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <div>
        {vencido ? (
          <p className="text-sm font-semibold">El precio de la oferta venció.</p>
        ) : (
          <>
            <p className="text-sm font-semibold">
              Esta oferta vence en {formatear(ms)}
            </p>
            <p className="text-xs opacity-90">
              Paga antes de que termine para mantener el precio.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
