"use client";

import { useActionState, useState } from "react";
import {
  enviarNota,
  cancelarCotizacion,
  type EstadoNota,
} from "./notas-actions";

export type Nota = {
  id: number;
  autor: string;
  mensaje: string;
  created_at: string;
};

const estadoInicial: EstadoNota = {};

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/*
  Hilo de notas/mensajes entre la dueña y el cliente sobre una cotización.

  - rol="admin": muestra el botón "Responder con nota" para escribirle al cliente.
  - rol="cliente": cuando la dueña ya respondió con una nota, el cliente puede
    contestar otro mensaje o cancelar (borrar) la cotización por completo.
*/
export default function NotasCotizacion({
  presupuestoId,
  notas,
  rol,
}: {
  presupuestoId: number;
  notas: Nota[];
  rol: "admin" | "cliente";
}) {
  const [estado, accion, enviando] = useActionState(enviarNota, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  const hayNotaAdmin = notas.some((n) => n.autor === "admin");
  // El cliente solo ve la zona de responder/cancelar cuando la dueña ya
  // escribió una nota sobre esta cotización.
  const clientePuedeResponder = rol === "cliente" && hayNotaAdmin;
  // El admin siempre puede iniciar/continuar la conversación.
  const adminPuedeResponder = rol === "admin";

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Hilo de mensajes */}
      {notas.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notas.map((n) => {
            const esAdmin = n.autor === "admin";
            // "Mío" depende de quién está mirando.
            const mio = (rol === "admin") === esAdmin;
            return (
              <li
                key={n.id}
                className={`flex flex-col ${mio ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    esAdmin
                      ? "bg-coral/15 text-tinta"
                      : "bg-[#2a1426] text-tinta"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{n.mensaje}</p>
                </div>
                <span className="mt-0.5 px-1 text-[11px] text-tinta-soft">
                  {esAdmin ? "La dueña" : "Cliente"} · {formatearHora(n.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Formulario para responder (admin siempre; cliente si la dueña respondió) */}
      {(adminPuedeResponder || clientePuedeResponder) && (
        <>
          {rol === "admin" && !abierto ? (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="btn-linea self-start px-4 py-2 text-sm"
            >
              {notas.length > 0 ? "Escribir otra nota" : "Responder con nota"}
            </button>
          ) : (
            <form action={accion} className="flex flex-col gap-2">
              <input
                type="hidden"
                name="presupuesto_id"
                value={presupuestoId}
              />
              <textarea
                name="mensaje"
                required
                rows={3}
                placeholder={
                  rol === "admin"
                    ? "Ej: Ese modelo solo viene en tallas infantiles, no hay en talla M. ¿Lo quieres así?"
                    : "Escribe tu respuesta…"
                }
                className="campo w-full resize-y"
              />
              {estado.error && (
                <p className="text-sm text-coral-dark">{estado.error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn-coral px-4 py-2 text-sm"
                >
                  {enviando
                    ? "Enviando…"
                    : rol === "admin"
                      ? "Enviar nota al cliente"
                      : "Enviar respuesta"}
                </button>
                {rol === "admin" && (
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="btn-linea px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}

      {/* Botón de cancelar la cotización (solo cliente, tras una nota de la dueña) */}
      {clientePuedeResponder && (
        <form
          action={cancelarCotizacion}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "¿Seguro que quieres cancelar esta cotización? Se eliminará por completo y no se puede deshacer.",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="presupuesto_id" value={presupuestoId} />
          <button
            type="submit"
            className="text-sm font-medium text-tinta-soft transition hover:text-coral-dark hover:underline"
          >
            Cancelar cotización
          </button>
        </form>
      )}
    </div>
  );
}
