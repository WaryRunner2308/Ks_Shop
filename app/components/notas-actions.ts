"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EstadoNota = { error?: string; ok?: boolean };

const esquemaNota = z.object({
  presupuesto_id: z.coerce.number().int().positive(),
  mensaje: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(1000, "El mensaje es muy largo."),
});

/**
 * Envía una nota/mensaje sobre una cotización. El "autor" lo decide el servidor
 * según el rol del usuario (admin o cliente); las políticas RLS lo refuerzan.
 * Al insertarse, un trigger avisa al otro lado por notificación.
 */
export async function enviarNota(
  _prev: EstadoNota,
  formData: FormData,
): Promise<EstadoNota> {
  const parsed = esquemaNota.safeParse({
    presupuesto_id: formData.get("presupuesto_id"),
    mensaje: formData.get("mensaje"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();
  const autor = perfil?.rol === "admin" ? "admin" : "cliente";

  const { error } = await supabase.from("notas_cotizacion").insert({
    presupuesto_id: parsed.data.presupuesto_id,
    autor,
    mensaje: parsed.data.mensaje,
  });
  if (error) {
    return { error: "No se pudo enviar el mensaje. Intenta de nuevo." };
  }

  revalidatePath("/admin");
  revalidatePath("/mis-solicitudes");
  return { ok: true };
}

/**
 * Cancela (borra por completo) una cotización desde el lado del cliente.
 * Usa la función segura cancelar_cotizacion(): valida que sea el dueño, avisa
 * al admin y borra el presupuesto con sus notas. Tras esto la tarjeta
 * desaparece de ambos lados.
 */
export async function cancelarCotizacion(formData: FormData): Promise<void> {
  const id = Number(formData.get("presupuesto_id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const supabase = await createClient();
  await supabase.rpc("cancelar_cotizacion", { p_id: id });

  revalidatePath("/mis-solicitudes");
  revalidatePath("/admin");
}
