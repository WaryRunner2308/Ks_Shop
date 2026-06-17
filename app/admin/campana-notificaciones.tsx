"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { marcarLeida, marcarTodasLeidas } from "./notificaciones-actions";

export type Notificacion = {
  id: number;
  mensaje: string;
  leida: boolean;
  created_at: string;
};

function hora(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CampanaNotificaciones({
  inicial,
}: {
  inicial: Notificacion[];
}) {
  const [notis, setNotis] = useState<Notificacion[]>(inicial);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const noLeidas = notis.filter((n) => !n.leida).length;

  // Suscripción a Realtime: cada notificación nueva entra en vivo.
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("notificaciones-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        (payload) => {
          const nueva = payload.new as Notificacion;
          setNotis((prev) => [nueva, ...prev]);
          setToast(nueva.mensaje);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // El toast se oculta solo a los 5 segundos.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Cerrar el desplegable al hacer clic fuera.
  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  async function leerUna(id: number) {
    setNotis((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    await marcarLeida(id);
  }

  async function leerTodas() {
    setNotis((prev) => prev.map((n) => ({ ...n, leida: true })));
    await marcarTodasLeidas();
  }

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-full border border-linea bg-white p-2 transition hover:bg-crema-2"
        aria-label="Notificaciones"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-tinta"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-white">
            {noLeidas}
          </span>
        )}
      </button>

      {/* Desplegable */}
      {abierto && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-linea bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-linea px-4 py-3">
            <span className="font-semibold text-tinta">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={leerTodas}
                className="text-xs font-medium text-coral-dark hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {notis.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-tinta-soft">
                No tienes notificaciones.
              </li>
            ) : (
              notis.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-2 border-b border-linea px-4 py-3 last:border-0 ${
                    n.leida ? "bg-white" : "bg-coral/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-tinta">{n.mensaje}</p>
                    <p className="mt-0.5 text-xs text-tinta-soft">
                      {hora(n.created_at)}
                    </p>
                  </div>
                  {!n.leida && (
                    <button
                      type="button"
                      onClick={() => leerUna(n.id)}
                      className="shrink-0 text-xs font-medium text-coral-dark hover:underline"
                    >
                      Leída
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Toast emergente */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 max-w-xs rounded-xl border border-linea bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-tinta">🔔 {toast}</p>
        </div>
      )}
    </div>
  );
}
