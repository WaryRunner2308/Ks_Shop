// Configuración de los métodos de pago: qué campos pide cada tipo, su recargo
// (comisión que se suma al monto) y comportamientos especiales (WhatsApp).
// Se usa en el formulario del admin, la validación y el checkout del cliente.

export type CampoMetodo = {
  nombre: string;
  etiqueta: string;
  requerido: boolean;
};

export type TipoConfig = {
  valor: string;
  etiqueta: string;
  campos: CampoMetodo[];
  // Recargo que se suma al monto al pagar con este método.
  recargoPorcentaje?: number; // p.ej. 6.5 = +6.5%
  recargoFijo?: number; // p.ej. 0.30 = +$0.30
  // Comportamientos especiales en el checkout:
  //  "bs"        -> Pago Móvil: avisar que consulte el precio en Bs por WhatsApp.
  //  "coordinar" -> Divisas: avisar que coordine entrega/depósito por WhatsApp.
  whatsapp?: "bs" | "coordinar";
  // Divisas no requiere que el admin configure datos de cuenta.
  sinConfig?: boolean;
};

export const TIPOS_METODO: TipoConfig[] = [
  {
    valor: "pago_movil",
    etiqueta: "Pago Móvil",
    campos: [
      { nombre: "banco", etiqueta: "Banco", requerido: true },
      { nombre: "cedula", etiqueta: "Cédula", requerido: true },
      { nombre: "telefono", etiqueta: "Teléfono", requerido: true },
    ],
    whatsapp: "bs",
  },
  {
    valor: "paypal",
    etiqueta: "PayPal",
    campos: [
      { nombre: "correo", etiqueta: "Correo de PayPal", requerido: true },
    ],
    recargoPorcentaje: 6.5,
    recargoFijo: 0.3,
  },
  {
    valor: "binance",
    etiqueta: "Binance Pay",
    campos: [
      {
        nombre: "correo_o_id",
        etiqueta: "Correo o ID de Binance",
        requerido: true,
      },
    ],
    recargoPorcentaje: 15,
  },
  {
    valor: "wally",
    etiqueta: "Wally",
    campos: [
      {
        nombre: "correo_o_telefono",
        etiqueta: "Correo o teléfono de Wally",
        requerido: true,
      },
    ],
  },
  {
    valor: "zinli",
    etiqueta: "Zinli",
    campos: [
      {
        nombre: "correo_o_telefono",
        etiqueta: "Correo o teléfono de Zinli",
        requerido: true,
      },
    ],
  },
  {
    valor: "divisas",
    etiqueta: "Divisas (efectivo / entrega personal)",
    campos: [], // no requiere configuración de cuenta
    sinConfig: true,
    whatsapp: "coordinar",
  },
];

export function configTipo(valor: string): TipoConfig | undefined {
  return TIPOS_METODO.find((t) => t.valor === valor);
}

export function etiquetaTipo(valor: string): string {
  return configTipo(valor)?.etiqueta ?? valor;
}

/**
 * Calcula el monto total a pagar con un método (base + recargo).
 * Devuelve el total y el recargo aplicado (ambos en dólares).
 */
export function calcularMonto(
  base: number,
  tipo: string,
): { total: number; recargo: number } {
  const config = configTipo(tipo);
  const pct = config?.recargoPorcentaje ?? 0;
  const fijo = config?.recargoFijo ?? 0;
  const recargo = base * (pct / 100) + fijo;
  // Redondeo a 2 decimales.
  const total = Math.round((base + recargo) * 100) / 100;
  return { total, recargo: Math.round(recargo * 100) / 100 };
}

/** Texto corto que explica el recargo de un método (o null si no tiene). */
export function textoRecargo(tipo: string): string | null {
  const config = configTipo(tipo);
  if (!config) return null;
  const partes: string[] = [];
  if (config.recargoPorcentaje) partes.push(`${config.recargoPorcentaje}%`);
  if (config.recargoFijo) partes.push(`$${config.recargoFijo.toFixed(2)}`);
  return partes.length ? `Comisión: +${partes.join(" + ")}` : null;
}
