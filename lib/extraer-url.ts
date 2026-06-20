// Extrae la primera URL (http/https) que aparezca dentro de un texto.
//
// Algunas apps (AliExpress, por ejemplo) NO dan el link solo: lo mandan dentro
// de un mensaje del tipo:
//   "He encontrado esto en AliExpress: | Teclado mecánico…  https://a.aliexpress.com/_EuRncWI"
// El cliente pega todo eso tal cual. El sistema debe ignorar el texto y quedarse
// únicamente con el enlace.
//
// Devuelve la URL encontrada (sin signos de puntuación pegados al final) o null
// si no hay ninguna.
export function extraerUrl(texto: string): string | null {
  if (!texto) return null;
  const match = texto.match(/https?:\/\/[^\s]+/i);
  if (!match) return null;
  // Quitar puntuación típica de fin de frase que pudo quedar pegada al enlace
  // (punto, coma, paréntesis, comillas…). No tocamos ?, &, = ni / porque son
  // parte legítima de muchas URLs.
  return match[0].replace(/["'.,;:!)\]}>]+$/, "").trim();
}
