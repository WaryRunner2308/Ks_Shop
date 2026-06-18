"use client";

import { useEffect, useId, useRef, useState } from "react";

type Opcion = { valor: string; etiqueta: string };

/*
  SelectorPlataforma — dropdown personalizado (reemplaza al <select> nativo).

  El <select> del sistema abre una lista con estilo del navegador (fondo blanco,
  texto ilegible en modo oscuro). Este componente la dibuja nosotros: superficie
  oscura, opción activa en fucsia y buena legibilidad. Guarda el valor en un
  <input hidden> para que el formulario lo envíe igual que antes.
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
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const contenedor = useRef<HTMLDivElement>(null);
  const listaId = useId();

  const seleccionada = opciones.find((o) => o.valor === valor);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (
        contenedor.current &&
        !contenedor.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, []);

  function elegir(v: string) {
    setValor(v);
    setAbierto(false);
  }

  return (
    <div className="relative" ref={contenedor}>
      {/* Valor real que envía el formulario */}
      <input type="hidden" name={name} value={valor} />

      {/* Disparador */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
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

      {/* Lista desplegable */}
      {abierto && (
        <ul
          id={listaId}
          role="listbox"
          className="lista-selector deslizar-entra absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/15 p-1.5"
          style={{
            background: "#241022",
            boxShadow:
              "0 24px 52px -14px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.4)",
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
                      ? "bg-coral/15 font-semibold text-coral-dark"
                      : "text-tinta hover:bg-white/[0.07]"
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
        </ul>
      )}
    </div>
  );
}
