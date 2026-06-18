// Helper de detección de plataforma para la instalación de la PWA.
// Funciones puras, sin estado: cada una lee directamente del navegador.
// Pensadas para correr solo en el cliente (protegen contra SSR igual).

// ¿La app ya corre instalada (modo standalone / agregada a inicio)?
export function estaInstalada(): boolean {
  if (typeof window === "undefined") return false;
  const standalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  // navigator.standalone es propio de Safari iOS.
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || iosStandalone;
}
