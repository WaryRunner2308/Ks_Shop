"use client";

import { useEffect, useState } from "react";
import { estaInstalada } from "./pwa-platform";

/*
  PwaInstallManager — invita a instalar K's Shop en el celular.

  Una sola unidad cohesionada con una máquina de estados:
    hidden    → no se muestra nada
    offering  → tarjeta/banner ofreciendo instalar
    done      → ya quedó instalada (no vuelve a aparecer)

  Android / Chrome / Edge: usa el prompt nativo del navegador (instalación
  automática). En iOS no se ofrece nada: Apple no expone ese prompt y la
  instalación manual la explica la dueña directamente a esos usuarios.
*/

// ── Evento nativo de instalación (no tipado por TS por defecto) ──────────────
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// ── Captura temprana, a nivel de módulo ─────────────────────────────────────
// Chrome dispara `beforeinstallprompt` muy pronto, a veces antes de que monte
// la UI. Lo atrapamos aquí, lo guardamos y avisamos a quien esté suscrito.
let eventoGuardado: EventoInstalacion | null = null;
const suscriptores = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    eventoGuardado = e as EventoInstalacion;
    suscriptores.forEach((avisar) => avisar());
  });
  window.addEventListener("appinstalled", () => {
    eventoGuardado = null;
    try {
      localStorage.setItem(CLAVE_LS, "installed");
    } catch {
      /* localStorage puede no estar disponible (modo privado) */
    }
  });
}

// ── Constantes de persistencia ──────────────────────────────────────────────
const CLAVE_LS = "ks_pwa_prompt_v1"; // localStorage: "installed" | "dismissed"
const CLAVE_SESION = "ks_pwa_visto"; // sessionStorage: mostrado en esta sesión

type Estado = "hidden" | "offering" | "done";

function leerLS(): string | null {
  try {
    return localStorage.getItem(CLAVE_LS);
  } catch {
    return null;
  }
}

function guardarLS(valor: "installed" | "dismissed") {
  try {
    localStorage.setItem(CLAVE_LS, valor);
  } catch {
    /* ignorar */
  }
}

function marcarVistoEstaSesion() {
  try {
    sessionStorage.setItem(CLAVE_SESION, "1");
  } catch {
    /* ignorar */
  }
}

function yaVistoEstaSesion(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_SESION) === "1";
  } catch {
    return false;
  }
}

export default function PwaInstallManager() {
  const [estado, setEstado] = useState<Estado>("hidden");

  // Registro del service worker (lo exige Chrome para permitir instalar).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* si falla el registro, la app sigue funcionando igual */
      });
    }
  }, []);

  // Lógica de aparición (corre una sola vez al montar).
  useEffect(() => {
    // 1) Si ya está instalada, nunca mostramos nada.
    if (estaInstalada()) return;
    // 2) Si en algún momento confirmó la instalación, no insistir más.
    if (leerLS() === "installed") return;
    // 3) Una vez por sesión como máximo (un "dismissed" anterior puede
    //    re-ofrecerse en una visita futura, pero no en cada navegación).
    if (yaVistoEstaSesion()) return;

    // Android / Desktop: mostramos cuando tengamos el evento capturado.
    // En iOS este evento nunca llega, así que no se ofrece nada (correcto).
    const mostrarSiHayEvento = () => {
      if (!eventoGuardado) return;
      marcarVistoEstaSesion();
      setEstado("offering");
    };

    if (eventoGuardado) {
      mostrarSiHayEvento();
    } else {
      suscriptores.add(mostrarSiHayEvento);
      return () => {
        suscriptores.delete(mostrarSiHayEvento);
      };
    }
  }, []);

  function descartar() {
    guardarLS("dismissed");
    setEstado("hidden");
  }

  async function instalar() {
    const evento = eventoGuardado;
    if (!evento) {
      setEstado("hidden");
      return;
    }
    try {
      await evento.prompt();
      const eleccion = await evento.userChoice;
      if (eleccion.outcome === "accepted") {
        guardarLS("installed");
        setEstado("done");
      } else {
        guardarLS("dismissed");
        setEstado("hidden");
      }
    } catch {
      setEstado("hidden");
    } finally {
      eventoGuardado = null;
    }
  }

  if (estado === "offering") {
    return <BannerOferta onInstalar={instalar} onDescartar={descartar} />;
  }

  return null;
}

// ── Banner de oferta ────────────────────────────────────────────────────────
function BannerOferta({
  onInstalar,
  onDescartar,
}: {
  onInstalar: () => void;
  onDescartar: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#1a0016]/90 p-4 shadow-[0_18px_50px_-12px_rgba(236,11,134,0.55)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icono-192.png"
              alt=""
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">
              Lleva K&apos;s Shop en tu celular
            </p>
            <p className="mt-0.5 text-sm text-[#b888a8]">
              Instálala con un toque y ábrela como una app, sin buscar el enlace.
            </p>
          </div>
          <button
            type="button"
            onClick={onDescartar}
            aria-label="Cerrar el aviso de instalación"
            className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#b888a8] transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onDescartar}
            className="flex-1 rounded-full border border-[#ffc9e4] px-4 py-2.5 text-sm font-medium text-[#8a5870] transition hover:bg-[#ffe7f4]"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={onInstalar}
            className="flex-1 rounded-full bg-gradient-to-br from-[#ff3aa5] to-[#c50670] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(236,11,134,0.55)] transition hover:brightness-105"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
