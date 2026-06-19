"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoTutorial = { error?: string };

const MAX_IMG = 5 * 1024 * 1024; // 5 MB
const MAX_PASOS = 20;

function archivoImagen(v: FormDataEntryValue | null): File | null {
  return v instanceof File && v.size > 0 ? v : null;
}

function chequearImagen(f: File, etiqueta: string): string | null {
  if (!f.type.startsWith("image/")) return `${etiqueta} debe ser una imagen.`;
  if (f.size > MAX_IMG) return `${etiqueta} debe pesar 5 MB o menos.`;
  return null;
}

export async function crearTutorial(
  _prev: EstadoTutorial,
  formData: FormData,
): Promise<EstadoTutorial> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Escribe el título del tutorial." };

  const portada = archivoImagen(formData.get("portada"));
  if (!portada) return { error: "Sube una imagen de portada." };
  const errPort = chequearImagen(portada, "La portada");
  if (errPort) return { error: errPort };

  const cantidad = Number(formData.get("pasos") ?? 0);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return { error: "Agrega al menos un paso." };
  }
  if (cantidad > MAX_PASOS) {
    return { error: `Máximo ${MAX_PASOS} pasos.` };
  }

  type PasoIn = { orden: number; descripcion: string; imagen: File | null };
  const pasos: PasoIn[] = [];
  for (let i = 0; i < cantidad; i++) {
    const desc = String(formData.get(`descripcion_${i}`) ?? "").trim();
    if (!desc) return { error: `Falta la descripción del paso ${i + 1}.` };
    const img = archivoImagen(formData.get(`imagen_${i}`));
    if (img) {
      const e = chequearImagen(img, `La imagen del paso ${i + 1}`);
      if (e) return { error: e };
    }
    pasos.push({ orden: i + 1, descripcion: desc, imagen: img });
  }

  const supabase = await createClient();

  // Insertamos la cabecera para obtener el id (RLS exige es_admin).
  const { data: tut, error: errTut } = await supabase
    .from("tutoriales")
    .insert({ titulo })
    .select("id")
    .single();
  if (errTut || !tut) {
    return { error: "No se pudo crear el tutorial (¿permisos de admin?)." };
  }
  const id = tut.id as number;

  const subidas: string[] = [];
  async function subir(file: File, nombre: string): Promise<string | null> {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ruta = `${id}/${nombre}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("tutoriales")
      .upload(ruta, file, { contentType: file.type });
    if (error) return null;
    subidas.push(ruta);
    return ruta;
  }

  try {
    const rutaPortada = await subir(portada, "portada");
    if (!rutaPortada) throw new Error("No se pudo subir la portada.");

    const filasPasos: {
      tutorial_id: number;
      orden: number;
      descripcion: string;
      imagen_url: string | null;
    }[] = [];
    for (const p of pasos) {
      let rutaImg: string | null = null;
      if (p.imagen) {
        rutaImg = await subir(p.imagen, `paso-${p.orden}`);
        if (!rutaImg)
          throw new Error(`No se pudo subir la imagen del paso ${p.orden}.`);
      }
      filasPasos.push({
        tutorial_id: id,
        orden: p.orden,
        descripcion: p.descripcion,
        imagen_url: rutaImg,
      });
    }

    const { error: e1 } = await supabase
      .from("tutoriales")
      .update({ portada_url: rutaPortada })
      .eq("id", id);
    if (e1) throw new Error("No se pudo guardar la portada.");

    const { error: e2 } = await supabase
      .from("tutorial_pasos")
      .insert(filasPasos);
    if (e2) throw new Error("No se pudieron guardar los pasos.");
  } catch (e) {
    // Si algo falla, limpiamos: imágenes subidas + el tutorial (cascade borra pasos).
    if (subidas.length > 0) {
      await supabase.storage.from("tutoriales").remove(subidas);
    }
    await supabase.from("tutoriales").delete().eq("id", id);
    return {
      error: e instanceof Error ? e.message : "No se pudo crear el tutorial.",
    };
  }

  revalidatePath("/admin/tutoriales");
  revalidatePath("/tutoriales");
  redirect("/admin/tutoriales");
}

// Eliminar un tutorial (borra sus pasos por cascade y limpia las imágenes).
export async function eliminarTutorial(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();

  const { data: tut } = await supabase
    .from("tutoriales")
    .select("portada_url")
    .eq("id", id)
    .single();
  const { data: pasos } = await supabase
    .from("tutorial_pasos")
    .select("imagen_url")
    .eq("tutorial_id", id);

  const rutas = [
    tut?.portada_url,
    ...(pasos ?? []).map((p) => p.imagen_url),
  ].filter((r): r is string => !!r);
  if (rutas.length > 0) {
    await supabase.storage.from("tutoriales").remove(rutas);
  }

  await supabase.from("tutoriales").delete().eq("id", id);
  revalidatePath("/admin/tutoriales");
  revalidatePath("/tutoriales");
}
