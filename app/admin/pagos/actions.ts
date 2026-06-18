"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Aprobar: marca el pago como verificado (solo si estaba "registrado") y mueve
// el presupuesto a "confirmado" (sale del panel y pasa a Confirmadas).
export async function aprobarPago(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  const { data: pago } = await supabase
    .from("pagos")
    .update({ estado: "verificado" })
    .eq("id", id)
    .eq("estado", "registrado")
    .select("presupuesto_id")
    .maybeSingle();

  if (pago?.presupuesto_id) {
    await supabase
      .from("presupuestos")
      .update({ estado: "confirmado" })
      .eq("id", pago.presupuesto_id);
  }

  revalidatePath("/admin/pagos");
  revalidatePath("/admin");
  revalidatePath("/admin/confirmadas");
}

// Rechazar: marca el pago como rechazado (solo si estaba "registrado").
export async function rechazarPago(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase
    .from("pagos")
    .update({ estado: "rechazado" })
    .eq("id", id)
    .eq("estado", "registrado");

  revalidatePath("/admin/pagos");
}
