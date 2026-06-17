"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_METODO, configTipo } from "@/lib/metodos-pago";

export type EstadoMetodo = {
  error?: string;
  ok?: boolean;
};

const valoresTipo = TIPOS_METODO.map((t) => t.valor) as [string, ...string[]];

// Construye un esquema de Zod con los campos obligatorios del tipo elegido y
// devuelve el objeto "detalles" ya validado, o un mensaje de error.
function validarDetalles(
  tipo: string,
  formData: FormData,
): { detalles: Record<string, string> } | { error: string } {
  const config = configTipo(tipo);
  if (!config) return { error: "Elige un tipo de método válido." };

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const campo of config.campos) {
    shape[campo.nombre] = campo.requerido
      ? z.string().trim().min(1, `Falta: ${campo.etiqueta}.`)
      : z.string().trim().optional();
  }

  const datos: Record<string, FormDataEntryValue | null> = {};
  for (const campo of config.campos) {
    datos[campo.nombre] = formData.get(campo.nombre);
  }

  const parsed = z.object(shape).safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Solo guardamos los campos con valor.
  const detalles: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(parsed.data)) {
    if (typeof valor === "string" && valor.length > 0) {
      detalles[clave] = valor;
    }
  }
  return { detalles };
}

export async function crearMetodo(
  _prev: EstadoMetodo,
  formData: FormData,
): Promise<EstadoMetodo> {
  const tipo = z.enum(valoresTipo).safeParse(formData.get("tipo"));
  if (!tipo.success) {
    return { error: "Elige un tipo de método válido." };
  }

  const resultado = validarDetalles(tipo.data, formData);
  if ("error" in resultado) return { error: resultado.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("metodos_pago")
    .insert({ tipo: tipo.data, detalles: resultado.detalles });

  if (error) {
    return { error: "No se pudo guardar el método. Intenta de nuevo." };
  }

  revalidatePath("/admin/metodos-pago");
  return { ok: true };
}

export async function actualizarMetodo(
  _prev: EstadoMetodo,
  formData: FormData,
): Promise<EstadoMetodo> {
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  const tipo = z.enum(valoresTipo).safeParse(formData.get("tipo"));
  if (!id.success || !tipo.success) {
    return { error: "Datos inválidos." };
  }

  const resultado = validarDetalles(tipo.data, formData);
  if ("error" in resultado) return { error: resultado.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("metodos_pago")
    .update({ detalles: resultado.detalles })
    .eq("id", id.data);

  if (error) {
    return { error: "No se pudo actualizar. Intenta de nuevo." };
  }

  revalidatePath("/admin/metodos-pago");
  return { ok: true };
}

// Activar / desactivar (acción simple de formulario).
export async function alternarActivo(formData: FormData) {
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase.from("metodos_pago").update({ activo }).eq("id", id);
  revalidatePath("/admin/metodos-pago");
}

// Eliminar (acción simple de formulario).
export async function eliminarMetodo(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  await supabase.from("metodos_pago").delete().eq("id", id);
  revalidatePath("/admin/metodos-pago");
}
