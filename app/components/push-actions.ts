"use server";

import { createClient } from "@/lib/supabase/server";

// Datos de una suscripción Web Push (lo que entrega el navegador).
export type SuscripcionPush = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

/**
 * Guarda (o actualiza) la suscripción push del dispositivo para el usuario
 * autenticado. Si el endpoint ya existía, lo reasigna a este usuario y refresca
 * las llaves.
 */
export async function guardarSuscripcionPush(sub: SuscripcionPush) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-auth" };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        usuario_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: sub.userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Elimina la suscripción de este dispositivo (cuando el usuario desactiva los
 * avisos o cambia de opinión).
 */
export async function eliminarSuscripcionPush(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "no-auth" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("usuario_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
