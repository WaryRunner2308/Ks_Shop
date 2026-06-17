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
      <header className="mb-8">
        <Link
          href="/admin"
          className="text-sm text-coral-dark hover:underline"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta">
          Métodos de pago
        </h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Configura cómo te pueden pagar tus clientes.
        </p>
      </header>

      <section className="mb-10">
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
          <p className="rounded-xl border border-dashed border-linea bg-white p-6 text-sm text-tinta-soft">
            Aún no has agregado métodos de pago.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {metodos.map((m) => (
              <FilaMetodo key={m.id} metodo={m} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
