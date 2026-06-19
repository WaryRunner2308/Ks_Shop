"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registrarPagoCurso, type EstadoPagoCurso } from "./actions";
import {
  configTipo,
  etiquetaTipo,
  calcularMonto,
  textoRecargo,
} from "@/lib/metodos-pago";
import { enlaceWhatsAppMensaje } from "@/lib/telefono";

type Metodo = {
  id: number;
  tipo: string;
  detalles: Record<string, string>;
};

type Props = {
  cursoId: number;
  cursoNombre: string;
  precio: number;
  metodos: Metodo[];
  adminTelefono: string | null;
};

const estadoInicial: EstadoPagoCurso = {};

function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 0 0 1.69 5.522l-.999 3.648 3.808-.999zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

export default function FormularioPagoCurso({
  cursoId,
  cursoNombre,
  precio,
  metodos,
  adminTelefono,
}: Props) {
  const [estado, accion, enviando] = useActionState(
    registrarPagoCurso,
    estadoInicial,
  );
  const [metodoSel, setMetodoSel] = useState<number | null>(null);

  const metodoActual = metodos.find((m) => m.id === metodoSel);
  const tipoActual = metodoActual?.tipo;
  const config = tipoActual ? configTipo(tipoActual) : undefined;
  const { total, recargo } = tipoActual
    ? calcularMonto(precio, tipoActual)
    : { total: precio, recargo: 0 };
  const recargoTexto = tipoActual ? textoRecargo(tipoActual) : null;

  // Para Divisas el comprobante es opcional (se coordina por WhatsApp).
  const comprobanteOpcional = config?.whatsapp === "coordinar";

  const msgBs = `Hola, necesito saber el precio en Bs para pagar el curso «${cursoNombre}».`;
  const msgDivisas = `Hola, quiero pagar en Divisas el curso «${cursoNombre}» y coordinar.`;
  const linkWa = (mensaje: string) =>
    adminTelefono ? enlaceWhatsAppMensaje(adminTelefono, mensaje) : null;

  if (estado.ok) {
    return (
      <div className="tarjeta aparecer p-8 text-center">
        <div className="estallar mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-coral/15 text-3xl text-coral-dark">
          ✓
        </div>
        <h1 className="font-display text-2xl text-tinta">¡Pago registrado!</h1>
        <p className="mt-3 text-sm leading-relaxed text-tinta-soft">
          Recibimos tu comprobante. Lo verificaremos y te confirmaremos pronto.
        </p>
        <Link href={`/cursos/${cursoId}`} className="btn-coral mt-6 px-6 py-3">
          Volver al curso
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="entrada flex flex-col gap-6">
      <input type="hidden" name="curso_id" value={cursoId} />

      {/* Monto a pagar (cambia según el método elegido) */}
      <div className="tarjeta border-coral/25 bg-gradient-to-br from-coral/15 to-transparent p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-tinta-soft">
          Monto a pagar{config ? ` · ${etiquetaTipo(config.valor)}` : ""}
        </p>
        <p className="font-display text-4xl text-coral-dark">
          ${total.toFixed(2)}
        </p>
        {recargo > 0 && (
          <p className="mt-1 text-xs text-tinta-soft">
            Precio ${precio.toFixed(2)} + comisión ${recargo.toFixed(2)}
            {recargoTexto ? ` (${recargoTexto.replace("Comisión: ", "")})` : ""}
          </p>
        )}
      </div>

      {/* Métodos de pago */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-tinta">
          Elige a dónde pagar
        </legend>

        {metodos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/12 bg-[#180516] p-4 text-sm text-tinta-soft">
            La tienda aún no tiene métodos de pago disponibles. Intenta más
            tarde.
          </p>
        ) : (
          metodos.map((m) => {
            const cfg = configTipo(m.tipo);
            const recTxt = textoRecargo(m.tipo);
            return (
              <label
                key={m.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-white/12 bg-[#180516] p-4 transition hover:-translate-y-0.5 hover:border-coral hover:bg-[#241022] has-[:checked]:border-coral has-[:checked]:bg-coral/10 has-[:checked]:ring-2 has-[:checked]:ring-coral/25"
              >
                <input
                  type="radio"
                  name="metodo_pago_id"
                  value={m.id}
                  onChange={() => setMetodoSel(m.id)}
                  className="mt-1 accent-coral"
                />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-tinta">
                    {etiquetaTipo(m.tipo)}
                    {recTxt && (
                      <span className="rounded-full bg-amber-400/12 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        {recTxt}
                      </span>
                    )}
                  </p>
                  {cfg && cfg.campos.length > 0 && (
                    <dl className="mt-1 text-sm text-tinta-soft">
                      {cfg.campos.map((campo) => {
                        const valor = m.detalles?.[campo.nombre];
                        if (!valor) return null;
                        return (
                          <div key={campo.nombre} className="flex gap-1">
                            <dt>{campo.etiqueta}:</dt>
                            <dd className="text-tinta">{valor}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                  {cfg?.sinConfig && (
                    <p className="mt-1 text-sm text-tinta-soft">
                      Efectivo o entrega personal (se coordina por WhatsApp).
                    </p>
                  )}
                </div>
              </label>
            );
          })
        )}
      </fieldset>

      {/* Aviso de WhatsApp para Pago Móvil (precio en Bs) o Divisas (coordinar) */}
      {config?.whatsapp && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-sm text-tinta">
            {config.whatsapp === "bs"
              ? "Para pagar por Pago Móvil debes comunicarte por WhatsApp para cotizar o solicitar el precio en Bs."
              : "Para pagar en Divisas debes comunicarte al WhatsApp para coordinar la entrega personal o depósito."}
          </p>
          {linkWa(config.whatsapp === "bs" ? msgBs : msgDivisas) ? (
            <a
              href={linkWa(config.whatsapp === "bs" ? msgBs : msgDivisas)!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1ebe5a]"
            >
              <IconoWhatsApp />
              Escribir por WhatsApp
            </a>
          ) : (
            <p className="text-xs text-tinta-soft">
              (El WhatsApp aún no está configurado.)
            </p>
          )}
        </div>
      )}

      {/* Comprobante */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-tinta">
          Sube tu comprobante (imagen)
          {comprobanteOpcional && (
            <span className="font-normal text-tinta-soft"> (opcional)</span>
          )}
        </span>
        <input
          type="file"
          name="comprobante"
          accept="image/*"
          required={!comprobanteOpcional}
          className="campo cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-crema-2 file:px-3 file:py-1.5 file:font-medium file:text-tinta hover:file:bg-coral hover:file:text-white"
        />
      </label>

      {estado.error && (
        <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral-dark">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || metodos.length === 0}
        className="btn-coral px-4 py-3"
      >
        {enviando ? "Registrando…" : "Registrar pago"}
      </button>
    </form>
  );
}
