// Configuración de los métodos de pago: qué campos pide cada tipo.
// Se usa tanto en el formulario (cliente) como en la validación (servidor).

export type CampoMetodo = {
  nombre: string;
  etiqueta: string;
  requerido: boolean;
};

export type TipoConfig = {
  valor: string;
  etiqueta: string;
  campos: CampoMetodo[];
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
  },
  {
    valor: "transferencia",
    etiqueta: "Transferencia bancaria",
    campos: [
      { nombre: "banco", etiqueta: "Banco", requerido: true },
      { nombre: "titular", etiqueta: "Titular de la cuenta", requerido: true },
      { nombre: "numero_cuenta", etiqueta: "Número de cuenta", requerido: true },
      { nombre: "cedula", etiqueta: "Cédula / RIF", requerido: true },
    ],
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
  },
  {
    valor: "paypal",
    etiqueta: "PayPal",
    campos: [{ nombre: "correo", etiqueta: "Correo de PayPal", requerido: true }],
  },
  {
    valor: "zelle",
    etiqueta: "Zelle",
    campos: [
      { nombre: "titular", etiqueta: "Titular", requerido: true },
      { nombre: "correo", etiqueta: "Correo o teléfono", requerido: true },
    ],
  },
];

export function configTipo(valor: string): TipoConfig | undefined {
  return TIPOS_METODO.find((t) => t.valor === valor);
}

export function etiquetaTipo(valor: string): string {
  return configTipo(valor)?.etiqueta ?? valor;
}
