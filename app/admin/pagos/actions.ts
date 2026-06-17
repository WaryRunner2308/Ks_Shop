"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Aprobar: marca el pago como verificado (solo si estaba "registrado").
export async function aprobarPago(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase
    .from("pagos")
    .update({ estado: "verificado" })
    .eq("id", id)
    .eq("estado", "registrado");

  revalidatePath("/admin/pagos");
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
