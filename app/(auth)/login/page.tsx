"use client";

import Link from "next/link";
import { useActionState } from "react";
import { iniciarSesion, type EstadoAuth } from "@/app/auth/actions";

const estadoInicial: EstadoAuth = {};

export default function LoginPage() {
  const [estado, accion, enviando] = useActionState(
    iniciarSesion,
    estadoInicial,
  );

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl tracking-tight text-tinta">
          Bienvenida de vuelta
        </h2>
        <p className="mt-2 text-sm text-tinta-soft">
          Inicia sesión para ver tus pedidos y cotizaciones.
        </p>
      </header>

      <form action={accion} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
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
          {enviando ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-tinta-soft">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-coral-dark hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
