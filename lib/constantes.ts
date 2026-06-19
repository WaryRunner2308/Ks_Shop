// Plataformas que ofrece K's Shop. El "valor" se guarda en la base de datos;
// la "etiqueta" es lo que ve el cliente.
export const PLATAFORMAS = [
  { valor: "aliexpress",        etiqueta: "AliExpress"              },
  { valor: "shein",             etiqueta: "Shein"                   },
  { valor: "temu",              etiqueta: "Temu"                    },
  { valor: "ebay",              etiqueta: "eBay"                    },
  { valor: "romwe",             etiqueta: "Romwe"                   },
  { valor: "fashionnova",       etiqueta: "Fashion Nova"            },
  { valor: "dollskill",         etiqueta: "Dolls Kill"              },
  { valor: "babyboo",           etiqueta: "Babyboo"                 },
  { valor: "beautycreations",   etiqueta: "Beauty Creations"        },
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
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

// Devuelve la etiqueta bonita de una plataforma a partir de su valor guardado.
export function etiquetaPlataforma(valor: string): string {
  return PLATAFORMAS.find((p) => p.valor === valor)?.etiqueta ?? valor;
}

// Tipo de solicitud (coincide con la columna `tipo` de presupuestos).
export const TIPO_ETIQUETA: Record<string, string> = {
  producto: "Producto",
  carrito: "Carrito completo",
};

// ── Carritos completos ───────────────────────────────────────────────────────
// Plataformas que SÍ permiten compartir el carrito (tienen botón "compartir
// carrito" en su app). El "valor" debe existir en PLATAFORMAS: la etiqueta
// bonita se deriva con etiquetaPlataforma(), no se reescribe aquí.
//
// Cada una trae su regla de blindaje:
//   - hosts: dominios válidos. El host del link debe ser exactamente uno o
//     terminar en ".<host>" (así "api-shein.shein.com" cuenta como shein.com).
//   - huella: patrón que delata que es un carrito compartido (no un producto
//     suelto). Si es null, la plataforma no lo expone en la URL (caso Temu, que
//     usa un enlace corto opaco) y solo se valida el dominio.
export const CARRITO_PLATAFORMAS = [
  {
    valor: "shein",
    hosts: ["shein.com"],
    // Ej.: https://api-shein.shein.com/h5/sharejump/appjump?...&shc=2_xxxx
    huella: /sharejump|appjump|[?&]shc=/i,
  },
  {
    valor: "fashionnova",
    hosts: ["fashionnova.com"],
    // Ej.: https://www.fashionnova.com/pages/shared-cart/123:1,456:1
    huella: /\/shared-cart\//i,
  },
  {
    valor: "temu",
    // Temu solo es verificable hasta su subdominio de "compartir".
    hosts: ["share.temu.com"],
    // Ej.: https://share.temu.com/x53X1ARu24C  → enlace corto opaco.
    huella: null,
  },
] as const;

export type CarritoPlataforma = (typeof CARRITO_PLATAFORMAS)[number]["valor"];

// Opciones listas para el <SelectorPlataforma> en el modo carrito (mismo formato
// {valor, etiqueta} que PLATAFORMAS; la etiqueta se deriva para no duplicarla).
export const OPCIONES_CARRITO = CARRITO_PLATAFORMAS.map((c) => ({
  valor: c.valor,
  etiqueta: etiquetaPlataforma(c.valor),
}));
