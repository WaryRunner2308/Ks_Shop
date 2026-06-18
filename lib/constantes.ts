// Plataformas que ofrece K's Shop. El "valor" se guarda en la base de datos;
// la "etiqueta" es lo que ve el cliente.
export const PLATAFORMAS = [
  { valor: "aliexpress", etiqueta: "AliExpress" },
  { valor: "shein", etiqueta: "Shein" },
  { valor: "temu", etiqueta: "Temu" },
  { valor: "ebay", etiqueta: "eBay" },
] as const;

export type Plataforma = (typeof PLATAFORMAS)[number]["valor"];

// Disclaimer obligatorio sobre el envío internacional (ver CLAUDE.md).
export const DISCLAIMER_ENVIO =
  "El precio del envío internacional final se notificará una vez que el paquete llegue al país.";

// Etiquetas legibles para los estados del presupuesto.
export const ESTADO_ETIQUETA: Record<string, string> = {
  solicitado: "Solicitado",
  cotizado: "Cotizado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

// Devuelve la etiqueta bonita de una plataforma a partir de su valor guardado.
export function etiquetaPlataforma(valor: string): string {
  return PLATAFORMAS.find((p) => p.valor === valor)?.etiqueta ?? valor;
}
