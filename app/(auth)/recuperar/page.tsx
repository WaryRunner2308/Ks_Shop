"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  solicitarCodigoRecuperacion,
  restablecerConCodigo,
  type EstadoAuth,
} from "@/app/auth/actions";

const estadoInicial: EstadoAuth = {};

export default function RecuperarPage() {
  const [paso, setPaso] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");

  const [estado1, accion1, enviando1] = useActionState(
    solicitarCodigoRecuperacion,
    estadoInicial,
  );
  const [estado2, accion2, enviando2] = useActionState(
    restablecerConCodigo,
    estadoInicial,
  );

  // Cuando se envía el código con éxito, pasamos al paso 2.
  useEffect(() => {
    if (estado1.ok) setPaso("codigo");
  }, [estado1.ok]);

  return (
    <div>
      <header className="mb-8 text-center">
        <h2 className="font-display text-3xl tracking-tight text-tinta">
          {paso === "email" ? "Recuperar contraseña" : "Crea tu nueva clave"}
        </h2>
        <p className="mt-2 text-sm text-tinta-soft">
          {paso === "email"
            ? "Te enviaremos un código de 6 dígitos a tu correo."
            : `Escribe el código que enviamos a ${email} y tu nueva contraseña.`}
        </p>
      </header>

      {paso === "email" ? (
        <form action={accion1} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-tinta">Correo</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="campo"
            />
          </label>

          {estado1.error && (
            <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
              {estado1.error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando1}
            className="btn-coral mt-2 px-4 py-3"
          >
            {enviando1 ? "Enviando…" : "Enviar código"}
          </button>
        </form>
      ) : (
        <form action={accion2} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={email} />

          {estado1.mensaje && (
            <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
              {estado1.mensaje}
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-tinta">
              Código de 6 dígitos
            </span>
            <input
              type="text"
              name="codigo"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="campo tracking-[0.5em]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-tinta">
              Nueva contraseña
            </span>
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              minLength={6}
              placeholder="••••••••"
              className="campo"
            />
            <span className="text-xs text-tinta-soft">Mínimo 6 caracteres.</span>
          </label>

          {estado2.error && (
            <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
              {estado2.error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando2}
            className="btn-coral mt-2 px-4 py-3"
          >
            {enviando2 ? "Guardando…" : "Cambiar contraseña"}
          </button>

          <button
            type="button"
            onClick={() => setPaso("email")}
            className="text-center text-sm font-medium text-tinta-soft transition hover:text-tinta"
          >
            ¿No te llegó? Pedir otro código
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-tinta-soft">
        <Link
          href="/login"
          className="font-semibold text-coral-dark hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
