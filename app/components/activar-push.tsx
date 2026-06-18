"use client";

import { useEffect, useState } from "react";
import { estaInstalada } from "./pwa-platform";
import { guardarSuscripcionPush } from "./push-actions";

/*
  ActivarPush — botón para que el usuario active las notificaciones del sistema
  (Web Push) en este dispositivo.

  - Android / Chrome / escritorio: funciona directo.
  - iPhone (iOS): SOLO funciona si la app está instalada en la pantalla de inicio
    (iOS 16.4+). Si no, mostramos una guía corta en vez del botón.
*/

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Convierte la llave pública VAPID (base64url) al formato que pide el navegador.
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
    // iPadOS se reporta como Mac con pantalla táctil.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

type Estado =
  | "cargando" // averiguando el estado inicial
  | "no-soportado" // el navegador no soporta push
  | "ios-instalar" // iOS sin instalar: hay que agregarla al inicio
  | "activar" // se puede activar (aún no suscrito)
  | "activando" // en proceso
  | "activado" // ya suscrito en este dispositivo
  | "bloqueado" // el usuario bloqueó los permisos
  | "error";

export default function ActivarPush() {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    let cancelado = false;

    async function revisar() {
      const soporta =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        !!VAPID_PUBLIC;

      if (!soporta) {
        // En iOS viejo o navegador sin push: si es iPhone sin instalar, guiamos.
        if (esIOS() && !estaInstalada()) {
          if (!cancelado) setEstado("ios-instalar");
        } else if (!cancelado) {
          setEstado("no-soportado");
        }
        return;
      }

      // iPhone que aún no instaló la app: push no funciona hasta instalarla.
      if (esIOS() && !estaInstalada()) {
        if (!cancelado) setEstado("ios-instalar");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelado) setEstado("bloqueado");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelado) setEstado(sub ? "activado" : "activar");
      } catch {
        if (!cancelado) setEstado("activar");
      }
    }

    revisar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function activar() {
    setEstado("activando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "activar");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlAUint8Array(
            VAPID_PUBLIC!,
          ) as BufferSource,
        });
      }

      const json = sub.toJSON();
      const res = await guardarSuscripcionPush({
        endpoint: sub.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      setEstado(res.ok ? "activado" : "error");
    } catch {
      setEstado("error");
    }
  }

  // No mostramos nada mientras se averigua o si no aplica.
  if (estado === "cargando" || estado === "no-soportado") return null;

  if (estado === "activado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-tinta-soft">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-coral-dark"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Avisos activados
      </span>
    );
  }

  if (estado === "ios-instalar") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-tinta-soft">
        Para avisos: Compartir → “Agregar a inicio”
      </span>
    );
  }

  if (estado === "bloqueado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-tinta-soft">
        Avisos bloqueados (actívalos en ajustes)
      </span>
    );
  }

  if (estado === "error") {
    return (
      <button
        type="button"
        onClick={activar}
        className="btn-linea px-3 py-1.5 text-xs"
      >
        Reintentar avisos
      </button>
    );
  }

  // "activar" o "activando"
  return (
    <button
      type="button"
      onClick={activar}
      disabled={estado === "activando"}
      className="btn-coral px-3 py-1.5 text-xs"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {estado === "activando" ? "Activando…" : "Activar avisos"}
    </button>
  );
}
