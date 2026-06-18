"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PLATAFORMAS } from "@/lib/constantes";

export type EstadoCotizar = {
  error?: string;
  ok?: boolean;
  // Cuántos productos se enviaron (para el mensaje de éxito).
  cantidad?: number;
};

const valoresPlataforma = PLATAFORMAS.map((p) => p.valor) as [
  string,
  ...string[],
];

const MAX_PRODUCTOS = 15;
const MAX_IMG = 5 * 1024 * 1024; // 5 MB

const esquemaProducto = z.object({
  plataforma: z.enum(valoresPlataforma, { message: "Elige una plataforma." }),
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

// Una imagen es válida si: no se subió nada (opcional) o es imagen ≤ 5 MB.
function imagenValida(f: File | null): { ok: boolean; error?: string } {
  if (!f || f.size === 0) return { ok: true }; // opcional
  if (!f.type.startsWith("image/"))
    return { ok: false, error: "El archivo debe ser una imagen." };
  if (f.size > MAX_IMG)
    return { ok: false, error: "Cada imagen debe pesar 5 MB o menos." };
  return { ok: true };
}

type ProductoListo = {
  plataforma: string;
  url_producto: string;
  variante: string;
  imagen: File | null;
};

export async function crearSolicitud(
  _prev: EstadoCotizar,
  formData: FormData,
): Promise<EstadoCotizar> {
  const cantidad = Number(formData.get("cantidad") ?? 0);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return { error: "Agrega al menos un producto." };
  }
  if (cantidad > MAX_PRODUCTOS) {
    return { error: `Máximo ${MAX_PRODUCTOS} productos por solicitud.` };
  }

  // Validar cada producto.
  const productos: ProductoListo[] = [];
  for (let i = 0; i < cantidad; i++) {
    const parsed = esquemaProducto.safeParse({
      plataforma: formData.get(`plataforma_${i}`),
      url_producto: formData.get(`url_${i}`),
      variante: formData.get(`variante_${i}`),
    });
    if (!parsed.success) {
      const n = cantidad > 1 ? ` (producto ${i + 1})` : "";
      return { error: parsed.error.issues[0].message + n };
    }

    const imagen = formData.get(`imagen_${i}`);
    const archivo = imagen instanceof File ? imagen : null;
    const chequeo = imagenValida(archivo);
    if (!chequeo.ok) {
      const n = cantidad > 1 ? ` (producto ${i + 1})` : "";
      return { error: (chequeo.error ?? "Imagen inválida.") + n };
    }

    productos.push({
      plataforma: parsed.data.plataforma,
      url_producto: parsed.data.url_producto,
      variante: parsed.data.variante,
      imagen: archivo && archivo.size > 0 ? archivo : null,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  // Subir las imágenes que vengan (a la carpeta del propio usuario).
  const subidas: string[] = []; // rutas para limpiar si algo falla
  try {
    for (let i = 0; i < productos.length; i++) {
      const img = productos[i].imagen;
      if (!img) continue;
      const ext = (img.name.split(".").pop() || "jpg").toLowerCase();
      const ruta = `${user.id}/${Date.now()}-${i}.${ext}`;
      const { error: errImg } = await supabase.storage
        .from("referencias")
        .upload(ruta, img, { contentType: img.type });
      if (errImg) {
        throw new Error("No se pudo subir una de las imágenes.");
      }
      subidas.push(ruta);
      (productos[i] as ProductoListo & { rutaImagen?: string }).rutaImagen =
        ruta;
    }

    // Insertar un presupuesto por producto.
    const filas = productos.map((p) => ({
      usuario_id: user.id,
      plataforma: p.plataforma,
      url_producto: p.url_producto,
      variante: p.variante,
      imagen_url:
        (p as ProductoListo & { rutaImagen?: string }).rutaImagen ?? null,
    }));

    const { error: errInsert } = await supabase
      .from("presupuestos")
      .insert(filas);
    if (errInsert) {
      throw new Error("No se pudo enviar la solicitud. Intenta de nuevo.");
    }
  } catch (e) {
    // Limpiar imágenes subidas si algo falló.
    if (subidas.length > 0) {
      await supabase.storage.from("referencias").remove(subidas);
    }
    const msg =
      e instanceof Error ? e.message : "No se pudo enviar la solicitud.";
    return { error: msg };
  }

  revalidatePath("/mis-solicitudes");
  return { ok: true, cantidad: productos.length };
}
