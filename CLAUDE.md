# Sistema K's Shop

## Qué es
Web para "K's Shop", negocio de compras bajo pedido (AliExpress, Shein, Alibaba). El cliente solicita cotización pegando el link de un producto. La dueña pone el precio real desde SU cuenta y el sistema calcula el total aplicando su ganancia. El cliente paga y sube comprobante. La dueña recibe avisos dentro del sistema.

## Stack (gratis)
Next.js (App Router) + TypeScript + Tailwind. Supabase (Postgres, auth, storage, realtime). Vercel al final. Notificaciones in-app con Supabase Realtime, sin bots externos.

## Flujo de cotización (LO MÁS IMPORTANTE) — DOS pasos
1. El CLIENTE pega el link + la variante (talla, color). NO pega precio.
2. A la DUEÑA le llega la solicitud en su panel.
3. La DUEÑA abre el link desde SU cuenta (ve su precio real, sin descuentos de bienvenida) y escribe el precio real.
4. El SISTEMA calcula el total y lo envía al cliente.
POR QUÉ: las plataformas dan descuentos a usuarios nuevos; el precio del cliente NO es el de la dueña. Solo ella conoce su precio real, por eso ella lo ingresa. Evita discusiones.

## Fórmula
    total = precio_real × (1 + porcentaje_ganancia)
precio_real lo pone la dueña (ya incluye IVA/taxes). porcentaje_ganancia lo configura la dueña (ej. 0.20). El envío internacional NO se calcula. SIEMPRE mostrar disclaimer: "El precio del envío internacional final se notificará una vez que el paquete llegue al país."

## Snapshot
Cada cotización guarda el % de ganancia usado. Si la dueña cambia su %, las cotizaciones viejas NO se recalculan.

## Roles
cliente: solicita cotización, paga, sube comprobante. admin (dueña): pone precios, configura ganancia, ve pagos, recibe notificaciones.

## Tablas
usuarios, configuracion (porcentaje_ganancia), metodos_pago, presupuestos (link, variante, precio_real, total, % usado, estado), pagos (comprobante, monto, estado), notificaciones (mensaje, leida, para la dueña).

## Marca
Nombre: "K's Shop". Úsalo en título, encabezados y textos. Diseño limpio y confiable.

## Convenciones
TypeScript en todo. Validar con Zod. La función de cálculo DEBE tener tests. Commits pequeños tras cada parte. Explica en español; el dueño no es programador experto.
