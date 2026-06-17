"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EstadoPrecio = {
  error?: string;
  ok?: boolean;
};

const esquema = z.object({
  id: z.coerce.number().int().positive(),
  // El precio debe ser un número mayor que 0.
  precio_venta: z.coerce
    .number({ message: "Escribe un precio válido." })
    .positive("El precio debe ser un número mayor que 0."),
});

export async function enviarPrecio(
  _prev: EstadoPrecio,
  formData: FormData,
): Promise<EstadoPrecio> {
  const parsed = esquema.safeParse({
    id: formData.get("id"),
    precio_venta: formData.get("precio_venta"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // RLS exige rol admin para esta actualización. Solo cotizamos las que siguen
  // en estado "solicitado".
  const { data, error } = await supabase
    .from("presupuestos")
    .update({
      precio_venta: parsed.data.precio_venta,
      estado: "cotizado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("estado", "solicitado")
    .select("id");

  if (error) {
    return { error: "No se pudo guardar el precio. Intenta de nuevo." };
  }

  if (!data || data.length === 0) {
    return { error: "Esa solicitud ya no está pendiente." };
  }

  revalidatePath("/admin");
  return { ok: true };
}
