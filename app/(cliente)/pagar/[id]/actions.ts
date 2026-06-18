"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
  comprobante: z
    .instanceof(File)
    .refine((f) => f.size > 0, "Sube la imagen de tu comprobante.")
    .refine(
      (f) => f.type.startsWith("image/"),
      "El comprobante debe ser una imagen.",
    )
    .refine(
      (f) => f.size <= 5 * 1024 * 1024,
      "La imagen no debe pesar más de 5 MB.",
    ),
});

export async function registrarPago(
  _prev: EstadoPago,
  formData: FormData,
): Promise<EstadoPago> {
  const parsed = esquema.safeParse({
    presupuesto_id: formData.get("presupuesto_id"),
    metodo_pago_id: formData.get("metodo_pago_id"),
    comprobante: formData.get("comprobante"),
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

  // El presupuesto debe ser del cliente y estar "cotizado". RLS ya limita a
  // que solo vea los suyos; el precio se toma de la base, no del cliente.
  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select("id, precio_venta, estado")
    .eq("id", parsed.data.presupuesto_id)
    .single();

  if (!presupuesto || presupuesto.estado !== "cotizado") {
    return { error: "Esta solicitud no está disponible para pagar." };
  }

  // El método elegido debe existir y estar activo.
  const { data: metodo } = await supabase
    .from("metodos_pago")
    .select("id")
    .eq("id", parsed.data.metodo_pago_id)
    .eq("activo", true)
    .single();

  if (!metodo) {
    return { error: "El método de pago elegido ya no está disponible." };
  }

  // Subir el comprobante a la carpeta del propio usuario (lo exige la política).
  const archivo = parsed.data.comprobante;
  const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
  const ruta = `${user.id}/${presupuesto.id}-${Date.now()}.${ext}`;

  const { error: errorSubida } = await supabase.storage
    .from("comprobantes")
    .upload(ruta, archivo, { contentType: archivo.type });

  if (errorSubida) {
    return { error: "No se pudo subir el comprobante. Intenta de nuevo." };
  }

  // Registrar el pago. El trigger marca el presupuesto como "pagado".
  const { error: errorPago } = await supabase.from("pagos").insert({
    presupuesto_id: presupuesto.id,
    usuario_id: user.id,
    metodo_pago_id: parsed.data.metodo_pago_id,
    comprobante_url: ruta,
    monto_declarado: presupuesto.precio_venta,
    estado: "registrado",
  });

  if (errorPago) {
    // Si falla, intentamos limpiar el archivo subido.
    await supabase.storage.from("comprobantes").remove([ruta]);
    return { error: "No se pudo registrar el pago. Intenta de nuevo." };
  }

  revalidatePath("/mis-solicitudes");
  return { ok: true };
}
