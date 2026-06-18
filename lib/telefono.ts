// Utilidades de teléfono para Venezuela.
//
// El cliente escribe su número como está acostumbrado (con el 0, p.ej.
// 0412-542-3385) y el sistema lo guarda en formato internacional E.164
// (+584125423385). Así el botón de WhatsApp abre el chat sin fallar, porque
// wa.me necesita el código de país (+58) y NO funciona con el 0 inicial.

const CODIGO_PAIS = "58"; // Venezuela

/**
 * Normaliza un teléfono venezolano a formato internacional (+58XXXXXXXXXX).
 * Acepta los formatos más comunes:
 *   04125423385        -> +584125423385
 *   0412 542 3385      -> +584125423385
 *   4125423385         -> +584125423385
 *   +584125423385      -> +584125423385
 *   584125423385       -> +584125423385
 * Devuelve null si no logra reconocer un número válido.
 */
export function normalizarTelefonoVE(entrada: string): string | null {
  // Dejar solo dígitos y un posible "+" inicial.
  let s = (entrada || "").replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  // Prefijo internacional escrito como "00".
  if (s.startsWith("00")) s = s.slice(2);

  // Ya viene con código de país: 58 + 10 dígitos.
  if (s.startsWith(CODIGO_PAIS) && s.length === 12) {
    return "+" + s;
  }
  // Formato nacional con 0 inicial: 0 + 10 dígitos (04125423385).
  if (s.startsWith("0") && s.length === 11) {
    return "+" + CODIGO_PAIS + s.slice(1);
  }
  // 10 dígitos sin 0 ni código de país (4125423385 / 2125423385).
  if (s.length === 10) {
    return "+" + CODIGO_PAIS + s;
  }

  return null;
}

/**
 * Devuelve el enlace de WhatsApp (wa.me) para un teléfono ya normalizado.
 * wa.me usa solo dígitos, sin el "+".
 */
export function enlaceWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${digitos}`;
}
