"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EstadoCurso = { error?: string };

const esquema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre del curso.").max(120),
  descripcion: z
    .string()
    .trim()
    .min(1, "Escribe la descripción del curso."),
  precio: z.coerce
    .number({ message: "Escribe el precio del curso." })
    .positive("El precio debe ser mayor que 0."),
});

export async function crearCurso(
  _prev: EstadoCurso,
  formData: FormData,
): Promise<EstadoCurso> {
  const parsed = esquema.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    precio: formData.get("precio"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Foto opcional del curso.
  const imagen =
    formData.get("imagen") instanceof File &&
    (formData.get("imagen") as File).size > 0
      ? (formData.get("imagen") as File)
      : null;
  if (imagen) {
    if (!imagen.type.startsWith("image/")) {
      return { error: "La foto debe ser una imagen." };
    }
    if (imagen.size > 5 * 1024 * 1024) {
      return { error: "La foto debe pesar 5 MB o menos." };
    }
  }

  const supabase = await createClient();

  // Insertamos primero para obtener el id (RLS exige es_admin).
  const { data: curso, error } = await supabase
    .from("cursos")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
      precio: parsed.data.precio,
    })
    .select("id")
    .single();
  if (error || !curso) {
    return { error: "No se pudo crear el curso (¿permisos de admin?)." };
  }

  // Subimos la foto (si vino) y guardamos su ruta.
  if (imagen) {
    const ext = (imagen.name.split(".").pop() || "jpg").toLowerCase();
    const ruta = `${curso.id}/portada-${Date.now()}.${ext}`;
    const { error: errSubida } = await supabase.storage
      .from("cursos")
      .upload(ruta, imagen, { contentType: imagen.type });
    if (errSubida) {
      // Si falla la subida, deshacemos el curso para no dejarlo a medias.
      await supabase.from("cursos").delete().eq("id", curso.id);
      return { error: "No se pudo subir la foto. Intenta de nuevo." };
    }
    await supabase
      .from("cursos")
      .update({ imagen_url: ruta })
      .eq("id", curso.id);
  }

  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
  redirect("/admin/cursos");
}

// Eliminar un curso (sus pagos se borran por cascade; también su foto).
export async function eliminarCurso(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select("imagen_url")
    .eq("id", id)
    .single();
  if (curso?.imagen_url) {
    await supabase.storage.from("cursos").remove([curso.imagen_url]);
  }

  await supabase.from("cursos").delete().eq("id", id);
  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
}

// Confirmar el pago de un curso: lo marca como verificado (el trigger avisa al
// cliente). Solo si estaba "registrado".
export async function aprobarPagoCurso(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase
    .from("cursos_pagos")
    .update({ estado: "verificado" })
    .eq("id", id)
    .eq("estado", "registrado");

  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
}

// Rechazar el pago de un curso (solo si estaba "registrado").
export async function rechazarPagoCurso(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase
    .from("cursos_pagos")
    .update({ estado: "rechazado" })
    .eq("id", id)
    .eq("estado", "registrado");

  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
}
