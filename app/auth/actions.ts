"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizarTelefonoVE } from "@/lib/telefono";

// Estado que devuelven las acciones a los formularios.
export type EstadoAuth = {
  error?: string;
  ok?: boolean;
  mensaje?: string;
};

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  email: z.string().trim().email("El correo no es válido."),
  telefono: z.string().trim().min(1, "Escribe tu número de teléfono."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

const esquemaLogin = z.object({
  email: z.string().trim().email("El correo no es válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

const esquemaEmail = z.object({
  email: z.string().trim().email("El correo no es válido."),
});

const esquemaCodigo = z.object({
  email: z.string().trim().email("El correo no es válido."),
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código son 6 dígitos."),
  password: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
});

// Traduce los errores más comunes de Supabase a español.
function traducirError(mensaje: string): string {
  if (mensaje.includes("already registered")) {
    return "Ese correo ya tiene una cuenta. Inicia sesión.";
  }
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos. Verifica e intenta de nuevo.";
  }
  if (mensaje.includes("rate limit") || mensaje.includes("Too many")) {
    return "Demasiados intentos. Espera un momento e intenta de nuevo.";
  }
  if (mensaje.includes("Email not confirmed")) {
    return "Aún no confirmas tu correo. Revisa tu bandeja de entrada.";
  }
  return "Ocurrió un error. Intenta de nuevo.";
}

export async function registrarse(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const parsed = esquemaRegistro.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // El cliente puede escribir el número con el 0 (04125423385); aquí lo pasamos
  // a formato internacional (+584125423385) para que WhatsApp funcione.
  const telefono = normalizarTelefonoVE(parsed.data.telefono);
  if (!telefono) {
    return {
      error: "El teléfono no es válido. Escríbelo así: 04125423385",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // El nombre y el teléfono se guardan en los metadatos; el trigger de la
    // base de datos los copia a la tabla "usuarios" al crear el perfil.
    options: { data: { nombre: parsed.data.nombre, telefono } },
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  return {
    ok: true,
    mensaje:
      "¡Cuenta creada! Si te pedimos confirmar tu correo, revisa tu bandeja de entrada. Luego inicia sesión.",
  };
}

export async function iniciarSesion(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const parsed = esquemaLogin.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// Paso 1 de recuperación: enviar un código de 6 dígitos al correo.
// No revelamos si el correo existe o no (seguridad): siempre respondemos ok.
export async function solicitarCodigoRecuperacion(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const parsed = esquemaEmail.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
  );

  // Solo frenamos por límite de envíos; lo demás se trata como ok para no
  // filtrar qué correos existen.
  if (error && /rate|too many/i.test(error.message)) {
    return { error: "Demasiados intentos. Espera un momento e intenta de nuevo." };
  }

  return {
    ok: true,
    mensaje: "Si el correo existe, te enviamos un código de 6 dígitos.",
  };
}

// Paso 2 de recuperación: verificar el código y poner la nueva contraseña.
export async function restablecerConCodigo(
  _prev: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const parsed = esquemaCodigo.safeParse({
    email: formData.get("email"),
    codigo: formData.get("codigo"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Verificar el código (crea sesión si es válido).
  const { error: errVerif } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.codigo,
    type: "recovery",
  });
  if (errVerif) {
    return {
      error: "El código no es válido o ya expiró. Pide uno nuevo.",
    };
  }

  // Cambiar la contraseña del usuario ya autenticado por el código.
  const { error: errUpd } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (errUpd) {
    return { error: "No se pudo cambiar la contraseña. Intenta de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
