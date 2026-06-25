"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { OPCIONES_PLATAFORMA, CARRITO_PLATAFORMAS } from "@/lib/constantes";
import { validarLinkCarrito } from "@/lib/validar-carrito";
import { extraerUrl } from "@/lib/extraer-url";

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

type ProductoListo = {
  plataforma: string;
  url_producto: string;
  variante: string;
  rutaImagen: string;
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  // Validar cada producto. La imagen ya se subió desde el navegador; aquí solo
  // recibimos su RUTA (debe estar dentro de la carpeta del propio usuario).
  const productos: ProductoListo[] = [];
  for (let i = 0; i < cantidad; i++) {
    // El cliente puede pegar el link suelto o dentro del texto que comparten
    // apps como AliExpress: nos quedamos solo con el enlace.
    const urlCruda = String(formData.get(`url_${i}`) ?? "");
    const urlLink = extraerUrl(urlCruda) ?? urlCruda;
    const parsed = esquemaProducto.safeParse({
      plataforma: formData.get(`plataforma_${i}`),
      url_producto: urlLink,
      variante: formData.get(`variante_${i}`),
    });
    const n = cantidad > 1 ? ` (producto ${i + 1})` : "";
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message + n };
    }

    const ruta = String(formData.get(`ruta_${i}`) ?? "").trim();
    if (!ruta) {
      return { error: "Sube la imagen de referencia del producto." + n };
    }
    // Blindaje: la ruta debe pertenecer a la carpeta del usuario.
    if (!ruta.startsWith(`${user.id}/`)) {
      return { error: "La imagen no es válida. Vuelve a subirla." + n };
    }

    productos.push({
      plataforma: parsed.data.plataforma,
      url_producto: parsed.data.url_producto,
      variante: parsed.data.variante,
      rutaImagen: ruta,
    });
  }

  // Insertar un presupuesto por producto.
  const filas = productos.map((p) => ({
    usuario_id: user.id,
    plataforma: p.plataforma,
    url_producto: p.url_producto,
    variante: p.variante,
    tipo: "producto",
    imagen_url: p.rutaImagen,
  }));

  const { error: errInsert } = await supabase
    .from("presupuestos")
    .insert(filas);
  if (errInsert) {
    // Limpiar las imágenes ya subidas si el guardado falló.
    await supabase.storage
      .from("referencias")
      .remove(productos.map((p) => p.rutaImagen));
    return { error: "No se pudo enviar la solicitud. Intenta de nuevo." };
  }

  revalidatePath("/mis-solicitudes");
  return { ok: true, cantidad: productos.length };
}

// ── Carrito completo ──────────────────────────────────────────────────────────
// Solo Shein, Fashion Nova y Temu permiten compartir el carrito. Se valida la
// plataforma (debe ser una de esas) y se BLINDA el link: el dominio tiene que
// coincidir con la plataforma elegida (ver lib/validar-carrito.ts).
async function crearCarrito(formData: FormData): Promise<EstadoCotizar> {
  // Igual que con los productos: aceptar el link pegado dentro de un texto.
  const urlCarritoCruda = String(formData.get("carrito_url") ?? "");
  const urlCarrito = extraerUrl(urlCarritoCruda) ?? urlCarritoCruda;
  const parsed = esquemaCarrito.safeParse({
    plataforma: formData.get("carrito_plataforma"),
    url: urlCarrito,
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
