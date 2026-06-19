"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calcularMonto, configTipo } from "@/lib/metodos-pago";

export type EstadoPagoCurso = {
  error?: string;
  ok?: boolean;
};

const esquema = z.object({
  curso_id: z.coerce.number().int().positive(),
  metodo_pago_id: z.coerce
    .number({ message: "Elige un método de pago." })
    .int()
    .positive("Elige un método de pago."),
});

export async function registrarPagoCurso(
  _prev: EstadoPagoCurso,
  formData: FormData,
): Promise<EstadoPagoCurso> {
  const parsed = esquema.safeParse({
    curso_id: formData.get("curso_id"),
    metodo_pago_id: formData.get("metodo_pago_id"),
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

  // El curso debe existir y estar publicado.
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, precio, publicado")
    .eq("id", parsed.data.curso_id)
    .single();
  if (!curso || !curso.publicado) {
    return { error: "Este curso ya no está disponible." };
  }

  // Evitar pagos duplicados: si ya hay uno en proceso o confirmado, no insertar.
  const { data: pagoPrevio } = await supabase
    .from("cursos_pagos")
    .select("estado")
    .eq("curso_id", curso.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pagoPrevio?.estado === "verificado") {
    return { error: "Ya pagaste este curso." };
  }
  if (pagoPrevio?.estado === "registrado") {
    return { error: "Ya tienes un pago en proceso para este curso." };
  }

  // El método elegido debe existir y estar activo.
  const { data: metodo } = await supabase
    .from("metodos_pago")
    .select("id, tipo")
    .eq("id", parsed.data.metodo_pago_id)
    .eq("activo", true)
    .single();
  if (!metodo) {
    return { error: "El método de pago elegido ya no está disponible." };
  }

  const config = configTipo(metodo.tipo);
  // Para Divisas el comprobante es opcional (se coordina por WhatsApp).
  const comprobanteOpcional = config?.whatsapp === "coordinar";

  const archivo = formData.get("comprobante");
  const tieneArchivo = archivo instanceof File && archivo.size > 0;

  if (!tieneArchivo && !comprobanteOpcional) {
    return { error: "Sube la imagen de tu comprobante." };
  }

  let ruta: string | null = null;
  if (tieneArchivo) {
    const f = archivo as File;
    if (!f.type.startsWith("image/")) {
      return { error: "El comprobante debe ser una imagen." };
    }
    if (f.size > 5 * 1024 * 1024) {
      return { error: "La imagen no debe pesar más de 5 MB." };
    }
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    ruta = `${user.id}/curso-${curso.id}-${Date.now()}.${ext}`;
    const { error: errorSubida } = await supabase.storage
      .from("comprobantes")
      .upload(ruta, f, { contentType: f.type });
    if (errorSubida) {
      return { error: "No se pudo subir el comprobante. Intenta de nuevo." };
    }
  }

  // Monto declarado = precio del curso + comisión del método (PayPal, Binance…).
  const base = Number(curso.precio ?? 0);
  const { total } = calcularMonto(base, metodo.tipo);

  const { error: errorPago } = await supabase.from("cursos_pagos").insert({
    curso_id: curso.id,
    usuario_id: user.id,
    metodo_pago_id: parsed.data.metodo_pago_id,
    comprobante_url: ruta,
    monto_declarado: total,
    estado: "registrado",
  });

  if (errorPago) {
    if (ruta) await supabase.storage.from("comprobantes").remove([ruta]);
    return { error: "No se pudo registrar el pago. Intenta de nuevo." };
  }

  revalidatePath("/cursos");
  revalidatePath(`/cursos/${curso.id}`);
  return { ok: true };
}
