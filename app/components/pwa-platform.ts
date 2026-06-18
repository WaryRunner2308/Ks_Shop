// Helper de detección de plataforma para la instalación de la PWA.
// Funciones puras, sin estado: cada una lee directamente del navegador.
// Pensadas para correr solo en el cliente (protegen contra SSR igual).

function ua(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

// iPhone / iPad / iPod. (Los iPad modernos reportan "Macintosh", pero esos
// soportan instalación por Safari igual; este chequeo cubre el caso típico.)
export function esIOS(): boolean {
  return /iPad|iPhone|iPod/.test(ua());
}

// Chrome dentro de iOS se identifica con "CriOS". No puede instalar PWAs
// directamente: hay que abrir el enlace en Safari.
export function esIOSChrome(): boolean {
  return esIOS() && /CriOS/.test(ua());
}

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
