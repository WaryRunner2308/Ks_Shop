"use server";

import { createClient } from "@/lib/supabase/server";

// Marca una notificación como leída. RLS limita a que cada quien solo pueda
// actualizar las suyas (cliente: las propias; admin: las del negocio).
export async function marcarLeida(id: number) {
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
}

// Marca todas las no leídas como leídas (RLS limita al destinatario).
export async function marcarTodasLeidas() {
  const supabase = await createClient();
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("leida", false);
}
