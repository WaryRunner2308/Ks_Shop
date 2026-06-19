import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormularioMetodo from "./formulario-metodo";
import FilaMetodo from "./fila-metodo";

type Metodo = {
  id: number;
  tipo: string;
  detalles: Record<string, string>;
  activo: boolean;
};

export default async function MetodosPagoPage() {
  const supabase = await createClient();

  // RLS: solo el admin ve todos los métodos (incluidos los inactivos).
  const { data } = await supabase
    .from("metodos_pago")
    .select("id, tipo, detalles, activo")
    .order("created_at", { ascending: false })
    .returns<Metodo[]>();

  const metodos = data ?? [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 aparecer">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[#1c0618] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta">
          Métodos de pago
        </h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Configura cómo te pueden pagar tus clientes.
        </p>
      </header>

      <section className="mb-10 aparecer">
        <h2 className="mb-3 text-lg font-semibold text-tinta">
          Agregar método
        </h2>
        <FormularioMetodo />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-tinta">
          Mis métodos{" "}
          <span className="text-tinta-soft">({metodos.length})</span>
        </h2>
        {metodos.length === 0 ? (
          <p className="tarjeta border-dashed p-6 text-sm text-tinta-soft">
            Aún no has agregado métodos de pago.
          </p>
        ) : (
          <ul className="entrada flex flex-col gap-3">
            {metodos.map((m) => (
              <FilaMetodo key={m.id} metodo={m} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
