"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Opcion = { valor: string; etiqueta: string };

/*
  SelectorPlataforma — dropdown personalizado (reemplaza al <select> nativo).

  La lista se renderiza con un PORTAL directamente en <body>, posicionada de
  forma fija bajo el disparador. Así sale del "contexto de apilado" del
  formulario (cuyos campos con desenfoque se pintaban encima) y siempre queda
  arriba, con fondo sólido y legible. Guarda el valor en un <input hidden>.
*/
export default function SelectorPlataforma({
  name,
  opciones,
  placeholder = "Elige una…",
}: {
  name: string;
  opciones: readonly Opcion[];
  placeholder?: string;
}) {
  const [montado, setMontado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const listaId = useId();

  const seleccionada = opciones.find((o) => o.valor === valor);

  useEffect(() => setMontado(true), []);

  function recalcular() {
    if (disparador.current) setRect(disparador.current.getBoundingClientRect());
  }

  function alternar() {
    if (!abierto) recalcular();
    setAbierto((v) => !v);
  }

  // Cerrar al hacer clic fuera, con Escape, o al hacer scroll/resize.
  useEffect(() => {
    if (!abierto) return;

    function fuera(e: MouseEvent) {
      const t = e.target as Node;
      if (
        disparador.current?.contains(t) ||
        lista.current?.contains(t)
      ) {
        return;
      }
      setAbierto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    function alScrollear(e: Event) {
      // Si el scroll ocurre DENTRO de la propia lista, no cerrar (el usuario
      // está navegando las opciones). Solo cerrar si se mueve la página.
      const t = e.target as Node | null;
      if (t && lista.current?.contains(t)) return;
      setAbierto(false);
    }
    function alRedimensionar() {
      setAbierto(false);
    }

    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", alScrollear, true);
    window.addEventListener("resize", alRedimensionar);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", alScrollear, true);
      window.removeEventListener("resize", alRedimensionar);
    };
  }, [abierto]);

  function elegir(v: string) {
    setValor(v);
    setAbierto(false);
  }

  return (
    <div className="relative">
      {/* Valor real que envía el formulario */}
      <input type="hidden" name={name} value={valor} />

      {/* Disparador */}
      <button
        ref={disparador}
        type="button"
        onClick={alternar}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listaId}
        className={`campo flex w-full items-center justify-between text-left ${
          seleccionada ? "text-tinta" : "text-tinta-soft"
        }`}
      >
        <span className="truncate">
          {seleccionada ? seleccionada.etiqueta : placeholder}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-coral-dark transition-transform duration-200 ${
            abierto ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Lista desplegable en un portal, fija bajo el disparador */}
      {montado &&
        abierto &&
        rect &&
        createPortal(
          <ul
            ref={lista}
            id={listaId}
            role="listbox"
            className="lista-selector deslizar-entra max-h-72 overflow-y-auto rounded-2xl border border-white/15 p-1.5"
            style={{
              position: "fixed",
              top: rect.bottom + 8,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
              background: "#241022",
              boxShadow:
                "0 24px 52px -14px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.5)",
            }}
          >
            {opciones.map((o) => {
              const activa = o.valor === valor;
              return (
                <li key={o.valor} role="option" aria-selected={activa}>
                  <button
                    type="button"
                    onClick={() => elegir(o.valor)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                      activa
                        ? "bg-coral/20 font-semibold text-coral-dark"
                        : "text-tinta hover:bg-white/[0.08]"
                    }`}
                  >
                    {o.etiqueta}
                    {activa && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
