"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PLATAFORMAS } from "@/lib/constantes";

export type EstadoCotizar = {
  error?: string;
  ok?: boolean;
};

const valoresPlataforma = PLATAFORMAS.map((p) => p.valor) as [
  string,
  ...string[],
];

const esquema = z.object({
  plataforma: z.enum(valoresPlataforma, {
    message: "Elige una plataforma.",
  }),
  url_producto: z
    .string()
    .trim()
    .min(1, "Pega el link del producto.")
    .url("El link no es válido (debe empezar con http:// o https://)."),
  variante: z
    .string()
    .trim()
    .min(1, "Escribe la variante que quieres (talla, color, etc.)."),
});

export async function crearSolicitud(
  _prev: EstadoCotizar,
  formData: FormData,
): Promise<EstadoCotizar> {
  const parsed = esquema.safeParse({
    plataforma: formData.get("plataforma"),
    url_producto: formData.get("url_producto"),
    variante: formData.get("variante"),
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

  // Se crea el presupuesto con estado "solicitado" (por defecto) y precio_venta
  // vacío: la dueña lo cotizará después.
  const { error } = await supabase.from("presupuestos").insert({
    usuario_id: user.id,
    plataforma: parsed.data.plataforma,
    url_producto: parsed.data.url_producto,
    variante: parsed.data.variante,
  });

  if (error) {
    return { error: "No se pudo enviar la solicitud. Intenta de nuevo." };
  }

  revalidatePath("/mis-solicitudes");
  return { ok: true };
}
