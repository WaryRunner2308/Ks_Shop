"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Ocultar UNA confirmada del historial del admin (no afecta al cliente).
export async function ocultarConfirmadaAdmin(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase
    .from("presupuestos")
    .update({ archivada_admin: true })
    .eq("id", id)
    .eq("estado", "confirmado");

  revalidatePath("/admin/confirmadas");
  revalidatePath("/admin");
}

// Vaciar TODO el historial de confirmadas del admin (no afecta a los clientes).
export async function vaciarConfirmadasAdmin() {
  const supabase = await createClient();
  await supabase
    .from("presupuestos")
    .update({ archivada_admin: true })
    .eq("estado", "confirmado")
    .eq("archivada_admin", false);

  revalidatePath("/admin/confirmadas");
  revalidatePath("/admin");
}
