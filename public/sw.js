// Service worker de K's Shop.
//
// Dos propósitos:
//  1) Habilitar la instalación de la PWA (Chrome exige un SW con handler 'fetch').
//     Es passthrough: NO cachea nada, para no servir versiones viejas.
//  2) Recibir y mostrar notificaciones push del sistema (Web Push), incluso con
//     la app cerrada.

self.addEventListener("install", () => {
  // Activar de inmediato la versión nueva sin esperar pestañas viejas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Tomar control de las pestañas abiertas en cuanto se activa.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Passthrough: dejamos que el navegador maneje cada petición normalmente.
});

// ── Push: el servidor envió un aviso; lo mostramos como notificación. ─────────
self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : "" };
  }

  const titulo = datos.title || "K's Shop";
  const opciones = {
    body: datos.body || "Tienes una notificación nueva.",
    icon: "/icons/icono-192.png",
    badge: "/icons/icono-192.png",
    data: { url: datos.url || "/" },
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// ── Clic en la notificación: enfocar la app o abrirla. ────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientes) => {
        // Si ya hay una ventana abierta, la enfocamos.
        for (const cliente of clientes) {
          if ("focus" in cliente) {
            cliente.navigate(destino).catch(() => {});
            return cliente.focus();
          }
        }
        // Si no, abrimos una nueva.
        if (self.clients.openWindow) {
          return self.clients.openWindow(destino);
        }
      }),
  );
});
