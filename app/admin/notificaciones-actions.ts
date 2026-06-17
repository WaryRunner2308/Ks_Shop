"use server";

import { createClient } from "@/lib/supabase/server";

// Marca una notificación como leída (RLS exige rol admin).
export async function marcarLeida(id: number) {
  if (!Number.isInteger(id)) return;
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
}

// Marca todas las notificaciones como leídas.
export async function marcarTodasLeidas() {
  const supabase = await createClient();
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("leida", false);
}
