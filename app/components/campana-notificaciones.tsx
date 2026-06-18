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

type Props = {
  inicial: Notificacion[];
  // Nombre único del canal de Realtime (evita choques entre admin y cliente).
  canal: string;
  // Filtro opcional de Realtime (p.ej. "usuario_id=eq.<id>"). El admin no usa
  // filtro: la RLS ya le entrega solo las del negocio.
  filtro?: string;
};

export default function CampanaNotificaciones({ inicial, canal, filtro }: Props) {
  const [notis, setNotis] = useState<Notificacion[]>(inicial);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [vibrando, setVibrando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const noLeidas = notis.filter((n) => !n.leida).length;

  // Suscripción a Realtime: cada notificación nueva entra en vivo.
  // IMPORTANTE: la tabla tiene RLS, así que el canal DEBE autenticarse con el
  // token del usuario ANTES de suscribirse. Si no, Realtime conecta como
  // "anónimo" y no entrega nada (el aviso solo aparecía al recargar la página).
  useEffect(() => {
    const supabase = createClient();
    let canalActivo: ReturnType<typeof supabase.channel> | null = null;
    let cancelado = false;

    async function suscribir() {
      // Espera a tener la sesión y pásale el token al cliente de Realtime.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelado) return;
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelado) return;

      canalActivo = supabase
        .channel(canal)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            ...(filtro ? { filter: filtro } : {}),
          },
          (payload) => {
            const nueva = payload.new as Notificacion;
            // Evita duplicar si llega dos veces.
            setNotis((prev) =>
              prev.some((n) => n.id === nueva.id) ? prev : [nueva, ...prev],
            );
            setToast(nueva.mensaje);
            setVibrando(true);
          },
        )
        .subscribe();
    }

    suscribir();

    return () => {
      cancelado = true;
      if (canalActivo) supabase.removeChannel(canalActivo);
    };
  }, [canal, filtro]);

  // El toast se oculta solo a los 5 segundos.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // La vibración de la campana dura lo que la animación.
  useEffect(() => {
    if (!vibrando) return;
    const t = setTimeout(() => setVibrando(false), 800);
    return () => clearTimeout(t);
  }, [vibrando]);

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
          className={`text-tinta ${vibrando ? "campaneo" : ""}`}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="latido absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-white">
            {noLeidas}
          </span>
        )}
      </button>

      {/* Desplegable */}
      {abierto && (
        <div className="deslizar-entra fixed inset-x-3 top-[5rem] z-40 overflow-hidden rounded-2xl border border-linea bg-white shadow-[var(--sombra-flota)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:rounded-xl sm:shadow-[var(--sombra-media)]">
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
        <div className="deslizar-entra fixed right-4 top-4 z-50 flex max-w-xs items-start gap-3 overflow-hidden rounded-xl border border-linea bg-white py-3 pl-4 pr-4 shadow-[var(--sombra-flota)]">
          <span className="absolute inset-y-0 left-0 w-1 bg-coral" />
          <span className="text-lg">🔔</span>
          <p className="text-sm font-medium text-tinta">{toast}</p>
        </div>
      )}
    </div>
  );
}
