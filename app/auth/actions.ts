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

// Traduce los errores más comunes de Supabase a español.
function traducirError(mensaje: string): string {
  if (mensaje.includes("already registered")) {
    return "Ese correo ya tiene una cuenta. Inicia sesión.";
  }
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
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

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
