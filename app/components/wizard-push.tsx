"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { estaInstalada } from "./pwa-platform";
import { guardarSuscripcionPush } from "./push-actions";

/*
  WizardPush — ventana centrada que invita a activar las notificaciones.

  - Aparece automáticamente al entrar (para usuarios con sesión).
  - Sigue apareciendo en cada visita HASTA que el usuario acepte y se suscriba.
  - Una vez suscrito (permiso concedido), no vuelve a salir.
  - "Ahora no" lo cierra esta vez; reaparece la próxima vez que abra la app.
  - iPhone sin instalar: muestra la guía para agregarla al inicio.
*/

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function base64UrlAUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normal);
  const salida = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) salida[i] = raw.charCodeAt(i);
  return salida;
}

function esIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

type Estado =
  | "oculto"
  | "preguntando"
  | "activando"
  | "ios-instalar"
  | "bloqueado"
  | "error";

export default function WizardPush() {
  const [montado, setMontado] = useState(false);
  const [estado, setEstado] = useState<Estado>("oculto");

  useEffect(() => setMontado(true), []);

  // Decide si mostrar el wizard al entrar.
  useEffect(() => {
    let cancelado = false;

    async function evaluar() {
      // iPhone que aún no instaló la app: push no funciona hasta instalarla.
      if (esIOS() && !estaInstalada()) {
        if (!cancelado) setEstado("ios-instalar");
        return;
      }

      const soporta =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        !!VAPID_PUBLIC;
      if (!soporta) return; // navegador sin push: no molestamos

      // Si bloqueó los permisos, no podemos volver a pedir.
      if (Notification.permission === "denied") return;

      // Si ya dio permiso, revisamos si hay suscripción.
      if (Notification.permission === "granted") {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) return; // ya está suscrito: nunca mostrar
          // Permiso concedido pero sin suscripción: la creamos en silencio.
          await suscribir();
          return;
        } catch {
          // si falla, ofrecemos el wizard
        }
      }

      if (!cancelado) setEstado("preguntando");
    }

    evaluar();
    return () => {
      cancelado = true;
    };
  }, []);

  // Crea la suscripción push y la guarda. Devuelve true si quedó suscrito.
  async function suscribir(): Promise<boolean> {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlAUint8Array(VAPID_PUBLIC!) as BufferSource,
      });
    }
    const json = sub.toJSON();
    const res = await guardarSuscripcionPush({
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
    return res.ok;
  }

  async function activar() {
    setEstado("activando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "preguntando");
        return;
      }
      const ok = await suscribir();
      setEstado(ok ? "oculto" : "error");
    } catch {
      setEstado("error");
    }
  }

  function ahoraNo() {
    setEstado("oculto");
  }

  if (!montado || estado === "oculto") return null;

  const esIosInstalar = estado === "ios-instalar";
  const esBloqueado = estado === "bloqueado";

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(6,0,8,0.72)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="surgir w-full max-w-sm overflow-hidden rounded-3xl border border-white/12 p-6 text-center"
        style={{
          background: "#1c0518",
          boxShadow: "0 32px 80px -22px rgba(0,0,0,0.85)",
        }}
      >
        {/* Ícono campana */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-coral/15">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-coral-dark"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </div>

        {esIosInstalar ? (
          <>
            <h2 className="font-display text-2xl text-tinta">
              Activa los avisos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tinta-soft">
              Para recibir avisos en tu iPhone, primero agrega la app a tu
              pantalla de inicio: toca{" "}
              <span className="font-semibold text-tinta">Compartir</span> y luego{" "}
              <span className="font-semibold text-tinta">
                “Agregar a inicio”
              </span>
              . Después vuelve a abrirla desde ahí.
            </p>
            <button
              type="button"
              onClick={ahoraNo}
              className="btn-coral mt-6 w-full px-5 py-3"
            >
              Entendido
            </button>
          </>
        ) : esBloqueado ? (
          <>
            <h2 className="font-display text-2xl text-tinta">
              Avisos bloqueados
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tinta-soft">
              Bloqueaste las notificaciones. Para activarlas, entra a los ajustes
              de notificaciones de tu navegador para este sitio y permítelas.
            </p>
            <button
              type="button"
              onClick={ahoraNo}
              className="btn-linea mt-6 w-full px-5 py-3"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl text-tinta">
              ¿Quieres recibir avisos?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tinta-soft">
              Te avisamos al instante cuando tu cotización tenga precio o haya
              novedades de tu pedido, aunque tengas la app cerrada.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={activar}
                disabled={estado === "activando"}
                className="btn-coral w-full px-5 py-3"
              >
                {estado === "activando"
                  ? "Activando…"
                  : estado === "error"
                    ? "Reintentar"
                    : "Sí, activar avisos"}
              </button>
              <button
                type="button"
                onClick={ahoraNo}
                className="w-full rounded-full px-5 py-2.5 text-sm font-medium text-tinta-soft transition hover:text-tinta"
              >
                Ahora no
              </button>
            </div>
            {estado === "error" && (
              <p className="mt-3 text-xs text-coral-dark">
                No se pudo activar. Intenta de nuevo.
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
