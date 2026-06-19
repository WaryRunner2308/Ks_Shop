import { CARRITO_PLATAFORMAS, etiquetaPlataforma } from "@/lib/constantes";

export type ResultadoCarrito =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Blindaje de links de carrito compartido.
 *
 * Comprueba que el link corresponda de verdad a la plataforma elegida:
 *   1. Que sea una URL http/https válida.
 *   2. Que el dominio (host) sea el de esa plataforma — esto es lo sólido y
 *      evita que peguen links de otra app o basura.
 *   3. Si la plataforma expone una "huella" de carrito en la URL (Shein,
 *      Fashion Nova), que el link la tenga. Temu usa un enlace corto opaco, así
 *      que ahí solo se exige que venga del subdominio de compartir.
 *
 * Devuelve la URL normalizada cuando todo cuadra.
 */
export function validarLinkCarrito(
  plataforma: string,
  raw: string,
): ResultadoCarrito {
  const conf = CARRITO_PLATAFORMAS.find((c) => c.valor === plataforma);
  if (!conf) {
    return { ok: false, error: "Esa plataforma no permite compartir el carrito." };
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return {
      ok: false,
      error: "El link no es válido (debe empezar con https://).",
    };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return {
      ok: false,
      error: "El link debe ser una dirección web (http:// o https://).",
    };
  }

  const nombre = etiquetaPlataforma(plataforma);
  const host = url.hostname.toLowerCase();
  const hostOk = conf.hosts.some((h) => host === h || host.endsWith("." + h));
  if (!hostOk) {
    return {
      ok: false,
      error: `Ese link no es de ${nombre}. Pega el link de “compartir carrito” de ${nombre}.`,
    };
  }

  if (conf.huella && !conf.huella.test(url.pathname + url.search)) {
    return {
      ok: false,
      error: `Ese link de ${nombre} no parece un carrito. Usa el botón “Compartir carrito” de la app.`,
    };
  }

  return { ok: true, url: url.toString() };
}
