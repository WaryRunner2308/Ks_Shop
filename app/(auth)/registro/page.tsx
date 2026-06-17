"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarse, type EstadoAuth } from "@/app/auth/actions";

const estadoInicial: EstadoAuth = {};

export default function RegistroPage() {
  const [estado, accion, enviando] = useActionState(
    registrarse,
    estadoInicial,
  );

  // Si el registro fue exitoso, mostramos un mensaje en vez del formulario.
  if (estado.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-coral/15 text-2xl">
          ✓
        </div>
        <h2 className="font-display text-2xl tracking-tight text-tinta">
          ¡Listo!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-tinta-soft">
          {estado.mensaje}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-coral px-6 py-3 font-semibold text-white transition hover:bg-coral-dark"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl tracking-tight text-tinta">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-sm text-tinta-soft">
          Empieza a pedir tus productos favoritos en minutos.
        </p>
      </header>

      <form action={accion} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">Nombre</span>
          <input
            type="text"
            name="nombre"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className="rounded-xl border border-linea bg-white px-4 py-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">Correo</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            className="rounded-xl border border-linea bg-white px-4 py-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-tinta">Contraseña</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className="rounded-xl border border-linea bg-white px-4 py-3 text-tinta outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </label>

        {estado.error && (
          <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
            {estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-xl bg-coral px-4 py-3 font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-tinta-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-coral-dark hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
