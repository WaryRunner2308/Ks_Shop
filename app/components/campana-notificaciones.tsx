"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  marcarLeida,
  marcarTodasLeidas,
  borrarNotificacion,
  borrarTodasNotificaciones,
} from "./notificaciones-actions";

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

// Una fila de notificación que se puede deslizar a la izquierda para borrarla
// (estilo iPhone). Si el gesto es solo un toque, los botones internos funcionan
// normal; solo se activa el arrastre cuando el movimiento es claramente horizontal.
function FilaNotificacion({
  n,
  onLeer,
  onBorrar,
}: {
  n: Notificacion;
  onLeer: (id: number) => void;
  onBorrar: (id: number) => void;
}) {
  const [dx, setDx] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const activo = useRef(false);

  function down(e: React.PointerEvent) {
    inicio.current = { x: e.clientX, y: e.clientY };
    activo.current = false;
  }
  function move(e: React.PointerEvent) {
    if (!inicio.current || saliendo) return;
    const ddx = e.clientX - inicio.current.x;
    const ddy = e.clientY - inicio.current.y;
    if (!activo.current) {
      // Decide si es arrastre horizontal (y no scroll vertical o un toque).
      if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) {
        activo.current = true;
        setArrastrando(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    setDx(Math.min(0, ddx)); // solo hacia la izquierda
  }
  function up() {
    if (activo.current) {
      setArrastrando(false);
      if (dx < -80) {
        setSaliendo(true);
        window.setTimeout(() => onBorrar(n.id), 200);
      } else {
        setDx(0);
      }
    }
    inicio.current = null;
    activo.current = false;
  }

  return (
    <li className="relative overflow-hidden border-b border-white/10 last:border-0">
      {/* Fondo rojo que se descubre al deslizar. */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-500/85 pr-5 text-white">
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
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </div>

      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{
          transform: `translateX(${saliendo ? -400 : dx}px)`,
          opacity: saliendo ? 0 : 1,
          transition: arrastrando
            ? "none"
            : "transform 0.2s ease, opacity 0.2s ease",
          touchAction: "pan-y",
          background: n.leida ? "#241022" : "#2c1330",
        }}
        className="relative flex items-start gap-2 px-4 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm text-tinta">{n.mensaje}</p>
          <p className="mt-0.5 text-xs text-tinta-soft">{hora(n.created_at)}</p>
        </div>
        {!n.leida && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLeer(n.id);
            }}
            className="shrink-0 text-xs font-medium text-coral-dark hover:underline"
          >
            Leída
          </button>
        )}
      </div>
    </li>
  );
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

  async function borrarUna(id: number) {
    setNotis((prev) => prev.filter((n) => n.id !== id));
    await borrarNotificacion(id);
  }

  async function borrarTodas() {
    setNotis([]);
    await borrarTodasNotificaciones();
  }

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-full border border-white/12 bg-[#20091c] p-2 transition hover:bg-white/10"
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
        <div
          className="deslizar-entra fixed inset-x-3 top-[5rem] z-40 overflow-hidden rounded-2xl border border-white/12 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:rounded-xl"
          style={{
            background: "#241022",
            boxShadow: "0 24px 52px -14px rgba(0,0,0,0.85)",
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <span className="font-semibold text-tinta">Notificaciones</span>
            <div className="flex items-center gap-3">
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={leerTodas}
                  className="text-xs font-medium text-coral-dark hover:underline"
                >
                  Marcar todas leídas
                </button>
              )}
              {notis.length > 0 && (
                <button
                  type="button"
                  onClick={borrarTodas}
                  aria-label="Borrar todas las notificaciones"
                  title="Borrar todas"
                  className="shrink-0 rounded-full p-1 text-tinta-soft transition hover:bg-white/10 hover:text-coral-dark"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {notis.length > 0 && (
            <p className="px-4 pt-2 text-[0.7rem] text-tinta-soft">
              Desliza una notificación a la izquierda para borrarla.
            </p>
          )}

          <ul className="max-h-96 overflow-y-auto">
            {notis.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-tinta-soft">
                No tienes notificaciones.
              </li>
            ) : (
              notis.map((n) => (
                <FilaNotificacion
                  key={n.id}
                  n={n}
                  onLeer={leerUna}
                  onBorrar={borrarUna}
                />
              ))
            )}
          </ul>
        </div>
      )}

      {/* Toast emergente */}
      {toast && (
        <div
          className="deslizar-entra fixed right-4 top-4 z-50 flex max-w-xs items-start gap-3 overflow-hidden rounded-xl border border-white/12 py-3 pl-4 pr-4"
          style={{
            background: "#241022",
            boxShadow: "0 24px 52px -14px rgba(0,0,0,0.85)",
          }}
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-coral" />
          <span className="text-lg">🔔</span>
          <p className="text-sm font-medium text-tinta">{toast}</p>
        </div>
      )}
    </div>
  );
}
