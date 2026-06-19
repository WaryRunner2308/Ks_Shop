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

  const supabase = await createClient();
  const { error } = await supabase.from("cursos").insert({
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion,
    precio: parsed.data.precio,
  });
  if (error) {
    return { error: "No se pudo crear el curso (¿permisos de admin?)." };
  }

  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
  redirect("/admin/cursos");
}

// Eliminar un curso (sus pagos se borran por cascade).
export async function eliminarCurso(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
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
