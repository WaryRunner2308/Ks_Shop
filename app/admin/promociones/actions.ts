"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoPromo = { error?: string; ok?: boolean };

const MAX_IMG = 5 * 1024 * 1024; // 5 MB

export async function crearPromocion(
  _prev: EstadoPromo,
  formData: FormData,
): Promise<EstadoPromo> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  if (!titulo) return { error: "Escribe el título de la promoción." };
  if (!descripcion) return { error: "Escribe la descripción de la promoción." };

  const imgEntry = formData.get("imagen");
  const imagen = imgEntry instanceof File && imgEntry.size > 0 ? imgEntry : null;
  if (imagen) {
    if (!imagen.type.startsWith("image/"))
      return { error: "La imagen debe ser un archivo de imagen." };
    if (imagen.size > MAX_IMG)
      return { error: "La imagen debe pesar 5 MB o menos." };
  }

  const supabase = await createClient();

  // Insertar la promoción dispara el trigger que difunde el push a todos los
  // clientes (private.difundir_promocion). El mensaje usa el título, así que la
  // imagen puede subirse después sin afectar el aviso.
  const { data: promo, error } = await supabase
    .from("promociones")
    .insert({ titulo, descripcion })
    .select("id")
    .single();
  if (error || !promo) {
    return { error: "No se pudo publicar la promoción (¿permisos de admin?)." };
  }

  if (imagen) {
    const id = promo.id as number;
    const ext = (imagen.name.split(".").pop() || "jpg").toLowerCase();
    const ruta = `${id}/portada-${Date.now()}.${ext}`;
    const { error: errUp } = await supabase.storage
      .from("promociones")
      .upload(ruta, imagen, { contentType: imagen.type });
    if (!errUp) {
      await supabase.from("promociones").update({ imagen_url: ruta }).eq("id", id);
    }
  }

  revalidatePath("/admin/promociones");
  revalidatePath("/promociones");
  return { ok: true };
}

export async function eliminarPromocion(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();

  const { data: promo } = await supabase
    .from("promociones")
    .select("imagen_url")
    .eq("id", id)
    .single();
  if (promo?.imagen_url) {
    await supabase.storage.from("promociones").remove([promo.imagen_url]);
  }

  await supabase.from("promociones").delete().eq("id", id);
  revalidatePath("/admin/promociones");
  revalidatePath("/promociones");
}
