"use client";

import { useEffect, useState } from "react";
import { esIOS, esIOSChrome, estaInstalada } from "./pwa-platform";

/*
  PwaInstallManager — invita a instalar K's Shop en el celular.

  Una sola unidad cohesionada con una máquina de estados:
    hidden     → no se muestra nada
    offering   → tarjeta/banner ofreciendo instalar
    ios-guide  → bottom-sheet con la guía manual de iOS
    done       → ya quedó instalada (no vuelve a aparecer)

  Android / Chrome / Edge: usa el prompt nativo del navegador (instalación
  automática). iOS: como no expone ese prompt, muestra una guía paso a paso.
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

type Estado = "hidden" | "offering" | "ios-guide" | "done";

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
  // La plataforma no cambia durante la sesión: la calculamos una sola vez.
  const [enIOS] = useState(() => esIOS());
  const [enIOSChrome] = useState(() => esIOSChrome());

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

    if (enIOS) {
      // iOS no tiene prompt nativo: tras un breve respiro, ofrecemos igual.
      const t = setTimeout(() => {
        if (estaInstalada()) return;
        marcarVistoEstaSesion();
        setEstado("offering");
      }, 1500);
      return () => clearTimeout(t);
    }

    // Android / Desktop: mostramos cuando tengamos el evento capturado.
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
  }, [enIOS]);

  function descartar() {
    guardarLS("dismissed");
    setEstado("hidden");
  }

  async function instalar() {
    if (enIOS) {
      // En iOS pasamos a la guía manual.
      setEstado("ios-guide");
      return;
    }
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

  function listoIOS() {
    // En iOS no hay confirmación programática; si pulsa "Listo" asumimos que
    // siguió los pasos y no volvemos a molestar.
    guardarLS("installed");
    setEstado("done");
  }

  if (estado === "offering") {
    return (
      <BannerOferta
        enIOS={enIOS}
        onInstalar={instalar}
        onDescartar={descartar}
      />
    );
  }

  if (estado === "ios-guide") {
    return (
      <GuiaIOS
        esChrome={enIOSChrome}
        onListo={listoIOS}
        onCerrar={descartar}
      />
    );
  }

  return null;
}

// ── Banner de oferta (Android + iOS comparten el mismo) ─────────────────────
function BannerOferta({
  enIOS,
  onInstalar,
  onDescartar,
}: {
  enIOS: boolean;
  onInstalar: () => void;
  onDescartar: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-[#ffc9e4] bg-white/95 p-4 shadow-[0_18px_50px_-12px_rgba(236,11,134,0.45)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-[#ffd3ea]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icono-192.png"
              alt=""
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#1b0610]">
              Lleva K&apos;s Shop en tu celular
            </p>
            <p className="mt-0.5 text-sm text-[#8a5870]">
              {enIOS
                ? "Agrégala a tu pantalla de inicio y entra con un toque, como una app."
                : "Instálala con un toque y ábrela como una app, sin buscar el enlace."}
            </p>
          </div>
          <button
            type="button"
            onClick={onDescartar}
            aria-label="Cerrar el aviso de instalación"
            className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8a5870] transition hover:bg-[#ffe7f4] hover:text-[#1b0610]"
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
            {enIOS ? "Ver cómo" : "Instalar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Guía iOS: bottom-sheet que sube desde abajo ─────────────────────────────
function GuiaIOS({
  esChrome,
  onListo,
  onCerrar,
}: {
  esChrome: boolean;
  onListo: () => void;
  onCerrar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* si el navegador no deja copiar, el usuario puede copiarlo a mano */
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center">
      {/* Velo: tocar fuera cierra. */}
      <button
        type="button"
        aria-label="Cerrar la guía"
        onClick={onCerrar}
        className="absolute inset-0 bg-[#1b0610]/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cómo instalar K's Shop en iPhone"
        className="motion-safe:animate-[subir_0.35s_ease-out] relative w-full max-w-md rounded-t-3xl border-t border-[#ffc9e4] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_50px_-12px_rgba(236,11,134,0.45)]"
      >
        {/* Tirador */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#ffd3ea]" />

        <h2 className="text-xl font-semibold text-[#1b0610]">
          Instala K&apos;s Shop en tu pantalla de inicio
        </h2>

        {esChrome ? (
          // Variante para Chrome en iOS: primero abrir en Safari.
          <>
            <p className="mt-2 text-sm text-[#8a5870]">
              Estás en Chrome y aquí iOS no deja instalar la app. Abre este
              enlace en <strong className="text-[#1b0610]">Safari</strong> y listo.
            </p>
            <button
              type="button"
              onClick={copiarEnlace}
              aria-label="Copiar el enlace para abrirlo en Safari"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ffc9e4] bg-[#ffe7f4] px-4 py-3 text-sm font-semibold text-[#c50670] transition hover:brightness-105"
            >
              {copiado ? "¡Copiado! Pégalo en Safari" : "Copiar enlace"}
            </button>
            <div className="mt-5 border-t border-[#ffe7f4] pt-4">
              <p className="text-sm font-medium text-[#1b0610]">
                Ya en Safari, sigue estos pasos:
              </p>
              <PasosSafari />
            </div>
          </>
        ) : (
          // Variante Safari iOS directa.
          <>
            <p className="mt-2 text-sm text-[#8a5870]">
              Son tres toques y la tendrás siempre a mano, como una app.
            </p>
            <PasosSafari />
          </>
        )}

        <button
          type="button"
          onClick={onListo}
          className="mt-6 w-full rounded-full bg-gradient-to-br from-[#ff3aa5] to-[#c50670] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(236,11,134,0.55)] transition hover:brightness-105"
        >
          Listo
        </button>
      </div>

      {/* Animación del bottom-sheet (solo si el usuario no pidió menos movimiento). */}
      <style>{`@keyframes subir{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// Pasos visuales de Safari: incluye la fila del botón Compartir con la flecha
// animada que apunta hacia la barra inferior de Safari.
function PasosSafari() {
  return (
    <div className="mt-4 space-y-4">
      {/* Paso 1: botón Compartir + flecha animada hacia abajo */}
      <div className="rounded-2xl bg-[#fff3f9] p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#c50670] ring-1 ring-[#ffd3ea]">
            <IconoCompartir />
          </span>
          <p className="text-sm text-[#1b0610]">
            Toca el botón <strong>Compartir</strong> en la barra de abajo de
            Safari.
          </p>
        </div>
        <div className="mt-2 flex justify-center">
          <FlechaAbajo />
        </div>
      </div>

      {/* Paso 2 */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#fff3f9] p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#c50670] ring-1 ring-[#ffd3ea]">
          <IconoAgregar />
        </span>
        <p className="text-sm text-[#1b0610]">
          Elige <strong>Agregar a inicio</strong> en el menú.
        </p>
      </div>

      {/* Paso 3 */}
      <div className="flex items-center gap-3 rounded-2xl bg-[#fff3f9] p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#c50670] ring-1 ring-[#ffd3ea]">
          <IconoCheck />
        </span>
        <p className="text-sm text-[#1b0610]">
          Confirma con <strong>Agregar</strong> arriba a la derecha. ¡Ya está!
        </p>
      </div>
    </div>
  );
}

// ── Íconos en SVG ───────────────────────────────────────────────────────────
function IconoCompartir() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3v12M12 3l-4 4M12 3l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoAgregar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Flecha que rebota apuntando hacia abajo (a la barra de Safari).
function FlechaAbajo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-[#ec0b86] motion-safe:animate-bounce"
      aria-hidden="true"
    >
      <path
        d="M12 4v14M12 18l-5-5M12 18l5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
