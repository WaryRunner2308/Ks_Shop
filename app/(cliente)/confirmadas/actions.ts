"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Ocultar UNA compra confirmada del historial del cliente (no afecta al admin).
// Usa una función RPC SECURITY DEFINER porque el cliente no tiene update directo.
export async function ocultarConfirmadaCliente(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase.rpc("ocultar_confirmada_cliente", { p_id: id });

  revalidatePath("/confirmadas");
}

// Vaciar TODO el historial de confirmadas del cliente (no afecta al admin).
export async function vaciarConfirmadasCliente() {
  const supabase = await createClient();
  await supabase.rpc("vaciar_confirmadas_cliente");

  revalidatePath("/confirmadas");
}
