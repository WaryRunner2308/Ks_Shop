// Service worker mínimo de K's Shop.
//
// Chrome exige un service worker registrado con un handler de 'fetch' para
// considerar la app instalable. Este es intencionalmente liviano: NO cachea
// nada (la app siempre va a la red) para evitar servir versiones viejas. Su
// único propósito es habilitar la instalación de la PWA.

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
