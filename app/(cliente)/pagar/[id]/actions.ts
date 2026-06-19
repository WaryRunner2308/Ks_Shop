"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calcularMonto, configTipo } from "@/lib/metodos-pago";

export type EstadoPago = {
  error?: string;
  ok?: boolean;
};

const esquema = z.object({
  presupuesto_id: z.coerce.number().int().positive(),
  metodo_pago_id: z.coerce
    .number({ message: "Elige un método de pago." })
    .int()
    .positive("Elige un método de pago."),
});

export async function registrarPago(
  _prev: EstadoPago,
  formData: FormData,
): Promise<EstadoPago> {
  const parsed = esquema.safeParse({
    presupuesto_id: formData.get("presupuesto_id"),
    metodo_pago_id: formData.get("metodo_pago_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  // El presupuesto debe ser del cliente, estar "cotizado" y no estar vencido.
  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select("id, precio_venta, estado, expira_en")
    .eq("id", parsed.data.presupuesto_id)
    .single();

  if (!presupuesto || presupuesto.estado !== "cotizado") {
    return { error: "Esta solicitud no está disponible para pagar." };
  }
  if (
    presupuesto.expira_en != null &&
    new Date(presupuesto.expira_en).getTime() < Date.now()
  ) {
    return {
      error: "El precio de esta oferta venció. Pediremos uno nuevo.",
    };
  }

  // El método elegido debe existir y estar activo.
  const { data: metodo } = await supabase
    .from("metodos_pago")
    .select("id, tipo")
    .eq("id", parsed.data.metodo_pago_id)
    .eq("activo", true)
    .single();

  if (!metodo) {
    return { error: "El método de pago elegido ya no está disponible." };
  }

  const config = configTipo(metodo.tipo);
  // Para Divisas el comprobante es opcional (se coordina por WhatsApp).
  const comprobanteOpcional = config?.whatsapp === "coordinar";

  // Validar el comprobante (si vino, o si es obligatorio).
  const archivo = formData.get("comprobante");
  const tieneArchivo = archivo instanceof File && archivo.size > 0;

  if (!tieneArchivo && !comprobanteOpcional) {
    return { error: "Sube la imagen de tu comprobante." };
  }

  let ruta: string | null = null;
  if (tieneArchivo) {
    const f = archivo as File;
    if (!f.type.startsWith("image/")) {
      return { error: "El comprobante debe ser una imagen." };
    }
    if (f.size > 5 * 1024 * 1024) {
      return { error: "La imagen no debe pesar más de 5 MB." };
    }
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    ruta = `${user.id}/${presupuesto.id}-${Date.now()}.${ext}`;
    const { error: errorSubida } = await supabase.storage
      .from("comprobantes")
      .upload(ruta, f, { contentType: f.type });
    if (errorSubida) {
      return { error: "No se pudo subir el comprobante. Intenta de nuevo." };
    }
  }

  // Monto declarado = precio + comisión del método (PayPal, Binance…).
  const base = Number(presupuesto.precio_venta ?? 0);
  const { total } = calcularMonto(base, metodo.tipo);

  // Registrar el pago. El trigger marca el presupuesto como "pagado".
  const { error: errorPago } = await supabase.from("pagos").insert({
    presupuesto_id: presupuesto.id,
    usuario_id: user.id,
    metodo_pago_id: parsed.data.metodo_pago_id,
    comprobante_url: ruta,
    monto_declarado: total,
    estado: "registrado",
  });

  if (errorPago) {
    if (ruta) await supabase.storage.from("comprobantes").remove([ruta]);
    return { error: "No se pudo registrar el pago. Intenta de nuevo." };
  }

  revalidatePath("/mis-solicitudes");
  return { ok: true };
}
