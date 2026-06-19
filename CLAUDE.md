# Sistema K's Shop

Actúa como un desarrollador full-stack senior, experto en TypeScript, Next.js (App Router), React y Supabase. Estás trabajando conmigo en un sistema web llamado K's Shop.
Stack del proyecto:

Next.js (App Router) + TypeScript en todo el código.
Tailwind CSS para los estilos.
Supabase para base de datos (Postgres), autenticación, storage y realtime.
Validación de datos con Zod.
Server Actions de Next.js para la lógica del servidor.
pnpm como gestor de paquetes (el comando para arrancar el servidor es pnpm start).
Tengo el MCP de Supabase conectado, así que puedes crear y modificar tablas, triggers y políticas RLS directamente en mi base de datos.

## ⛔ REGLA DE ORO (OBLIGATORIA — leer primero)

NO hagas absolutamente NADA que no se te haya pedido de forma explícita. Esto aplica a TODO: no editar archivos, no crear archivos, no commitear, no pushear, no migrar la base de datos, no instalar, no refactorizar, no "mejorar", no adelantar pasos siguientes. Limítate EXACTAMENTE a lo que el dueño pidió en su último mensaje. Si crees que falta algo o conviene un paso adicional, primero PROPÓN y ESPERA confirmación; nunca lo ejecutes por tu cuenta. Ante la duda, pregunta. Esta regla aplica en esta sesión y en TODAS las sesiones futuras (incluidas sesiones con un Claude nuevo).

## Qué es

Web para "K's Shop", negocio de compras bajo pedido (AliExpress, Shein, Alibaba). El cliente solicita cotización pegando el link de un producto. La dueña mira el producto desde SU cuenta y escribe el PRECIO DE VENTA FINAL, que el sistema le envía al cliente tal cual. El cliente paga y sube comprobante. La dueña recibe avisos dentro del sistema.

## Stack (gratis)

Next.js (App Router) + TypeScript + Tailwind. Supabase (Postgres, auth, storage, realtime). Vercel al final. Notificaciones in-app con Supabase Realtime, sin bots externos.

## Cómo correr el sistema (IMPORTANTE — no olvidar)

Para correr el sistema es solo: `pnpm start`. El gestor de paquetes es **pnpm** (no npm). Usar SIEMPRE `pnpm` para los comandos de este proyecto.

## Flujo de cotización (LO MÁS IMPORTANTE) — DOS pasos

1. El CLIENTE pega el link + la variante (talla, color) y solicita la cotización. NO pega precio.
2. A la DUEÑA le llega el aviso en su panel. Ella mira el producto desde SU cuenta (ve su precio real, sin descuentos de bienvenida) y escribe directamente el PRECIO DE VENTA FINAL.
3. El SISTEMA le envía ese precio al cliente TAL CUAL, sin modificarlo ni calcular nada.
   POR QUÉ: las plataformas dan descuentos a usuarios nuevos; el precio del cliente NO es el de la dueña. Solo ella conoce su precio real y decide el precio de venta, por eso ella lo ingresa. Evita discusiones.

## Precio (la dueña lo pone; el sistema NO calcula el precio de venta ni la ganancia)

El sistema NO calcula el PRECIO DE VENTA ni la ganancia: la dueña lo escribe a mano y se envía TAL CUAL al cliente. SIEMPRE mostrar disclaimer: "El precio del envío internacional final se notificará una vez que el paquete llegue al país."

### ÚNICA excepción permitida — comisiones de método de pago (sí se calculan)

La dueña pidió que SOLO estos recargos se sumen automáticamente al pagar (no son ganancia, son la comisión de la plataforma; se muestran con desglose al cliente):

- **PayPal:** Monto + 6.5% + $0.30
- **Binance:** Monto + 15%
- **Wally, Zinli, Pago Móvil, Divisas:** sin recargo.
  Las reglas viven en `lib/metodos-pago.ts` (`calcularMonto`). No agregar otros cálculos de precio sin que la dueña lo pida explícitamente.

## Roles

cliente: solicita cotización, paga, sube comprobante. admin (dueña): mira productos y escribe el precio de venta final, ve pagos, recibe notificaciones.

## Tablas

usuarios, metodos_pago, presupuestos (plataforma, url_producto, variante, precio_venta, estado), pagos (comprobante, monto, estado), notificaciones (mensaje, leida, para la dueña). Estados de presupuesto: solicitado → cotizado → pagado / cancelado.
NOTA: la tabla `configuracion` y el campo `porcentaje_ganancia` YA NO SE USAN (quedaron obsoletos al eliminar el cálculo de ganancia).

## Marca

Nombre: "K's Shop". Úsalo en título, encabezados y textos. Diseño limpio y confiable.

## Convenciones

TypeScript en todo. Validar con Zod. Commits pequeños tras cada parte. Explica en español; el dueño no es programador experto.
