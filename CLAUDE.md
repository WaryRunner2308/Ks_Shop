# Sistema K's Shop

## Qué es
Web para "K's Shop", negocio de compras bajo pedido (AliExpress, Shein, Alibaba). El cliente solicita cotización pegando el link de un producto. La dueña mira el producto desde SU cuenta y escribe el PRECIO DE VENTA FINAL, que el sistema le envía al cliente tal cual. El cliente paga y sube comprobante. La dueña recibe avisos dentro del sistema.

## Stack (gratis)
Next.js (App Router) + TypeScript + Tailwind. Supabase (Postgres, auth, storage, realtime). Vercel al final. Notificaciones in-app con Supabase Realtime, sin bots externos.

## Flujo de cotización (LO MÁS IMPORTANTE) — DOS pasos
1. El CLIENTE pega el link + la variante (talla, color) y solicita la cotización. NO pega precio.
2. A la DUEÑA le llega el aviso en su panel. Ella mira el producto desde SU cuenta (ve su precio real, sin descuentos de bienvenida) y escribe directamente el PRECIO DE VENTA FINAL.
3. El SISTEMA le envía ese precio al cliente TAL CUAL, sin modificarlo ni calcular nada.
POR QUÉ: las plataformas dan descuentos a usuarios nuevos; el precio del cliente NO es el de la dueña. Solo ella conoce su precio real y decide el precio de venta, por eso ella lo ingresa. Evita discusiones.

## Precio (SIN cálculo)
El sistema NO calcula ningún precio ni ganancia. La dueña escribe el precio de venta final y el sistema lo envía sin modificarlo. SIEMPRE mostrar disclaimer: "El precio del envío internacional final se notificará una vez que el paquete llegue al país."

## Roles
cliente: solicita cotización, paga, sube comprobante. admin (dueña): mira productos y escribe el precio de venta final, ve pagos, recibe notificaciones.

## Tablas
usuarios, metodos_pago, presupuestos (plataforma, url_producto, variante, precio_venta, estado), pagos (comprobante, monto, estado), notificaciones (mensaje, leida, para la dueña). Estados de presupuesto: solicitado → cotizado → pagado / cancelado.
NOTA: la tabla `configuracion` y el campo `porcentaje_ganancia` YA NO SE USAN (quedaron obsoletos al eliminar el cálculo de ganancia).

## Marca
Nombre: "K's Shop". Úsalo en título, encabezados y textos. Diseño limpio y confiable.

## Convenciones
TypeScript en todo. Validar con Zod. Commits pequeños tras cada parte. Explica en español; el dueño no es programador experto.
