"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { OPCIONES_PLATAFORMA, CARRITO_PLATAFORMAS } from "@/lib/constantes";
import { validarLinkCarrito } from "@/lib/validar-carrito";

export type EstadoCotizar = {
  error?: string;
  ok?: boolean;
  // Cuántos productos se enviaron (para el mensaje de éxito).
  cantidad?: number;
  // Si la solicitud enviada fue un carrito completo (cambia el mensaje de éxito).
  carrito?: boolean;
};

const valoresPlataforma = OPCIONES_PLATAFORMA.map((p) => p.valor) as [
  string,
  ...string[],
];

const valoresCarrito = CARRITO_PLATAFORMAS.map((c) => c.valor) as [
  string,
  ...string[],
];

const esquemaCarrito = z.object({
  plataforma: z.enum(valoresCarrito, {
    message: "Elige una plataforma con carrito compartible.",
  }),
  url: z.string().trim().min(1, "Pega el link de tu carrito."),
});

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

// La imagen de referencia es OBLIGATORIA: debe subirse y ser imagen ≤ 5 MB.
function imagenValida(f: File | null): { ok: boolean; error?: string } {
  if (!f || f.size === 0)
    return { ok: false, error: "Sube la imagen de referencia del producto." };
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
  // El formulario manda "carrito" cuando el cliente eligió cotizar el carrito
  // completo. Es un flujo aparte: una sola plataforma + un solo link, blindado.
  if (formData.get("tipo") === "carrito") {
    return crearCarrito(formData);
  }

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
      tipo: "producto",
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

// ── Carrito completo ──────────────────────────────────────────────────────────
// Solo Shein, Fashion Nova y Temu permiten compartir el carrito. Se valida la
// plataforma (debe ser una de esas) y se BLINDA el link: el dominio tiene que
// coincidir con la plataforma elegida (ver lib/validar-carrito.ts).
async function crearCarrito(formData: FormData): Promise<EstadoCotizar> {
  const parsed = esquemaCarrito.safeParse({
    plataforma: formData.get("carrito_plataforma"),
    url: formData.get("carrito_url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const chequeo = validarLinkCarrito(parsed.data.plataforma, parsed.data.url);
  if (!chequeo.ok) {
    return { error: chequeo.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const { error } = await supabase.from("presupuestos").insert({
    usuario_id: user.id,
    plataforma: parsed.data.plataforma,
    url_producto: chequeo.url,
    variante: null,
    tipo: "carrito",
    imagen_url: null,
  });
  if (error) {
    return { error: "No se pudo enviar el carrito. Intenta de nuevo." };
  }

  revalidatePath("/mis-solicitudes");
  return { ok: true, cantidad: 1, carrito: true };
}
