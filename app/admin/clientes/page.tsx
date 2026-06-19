import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enlaceWhatsApp } from "@/lib/telefono";

type ClienteRow = {
  id: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  created_at: string;
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Tarjeta({ c }: { c: ClienteRow }) {
  const nombre = c.nombre?.trim() || c.email || "Cliente";

  return (
    <li className="tarjeta tarjeta-flota p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-tinta">{nombre}</p>
          {c.email && (
            <p className="truncate text-sm text-tinta-soft">{c.email}</p>
          )}
          <p className="mt-1 text-sm text-tinta-soft">
            {c.telefono ? (
              <span className="text-tinta">{c.telefono}</span>
            ) : (
              <span className="italic">Sin teléfono</span>
            )}
          </p>
          <p className="mt-1 text-xs text-tinta-soft">
            Se registró el {formatearFecha(c.created_at)}
          </p>
        </div>

        {c.telefono && (
          <a
            href={enlaceWhatsApp(c.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24zm4.71 10.4c-.06-.1-.23-.16-.5-.3-.27-.13-1.58-.78-1.82-.87-.24-.09-.42-.13-.6.13-.18.27-.69.87-.84 1.05-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.15-1.33-.79-.71-1.33-1.58-1.49-1.85-.16-.27-.02-.41.12-.55.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.13-.6-1.45-.83-1.99-.22-.52-.44-.45-.6-.46l-.51-.01c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.95 2.57 1.08 2.75.13.18 1.87 2.85 4.53 4 .63.27 1.13.43 1.51.56.64.2 1.22.17 1.68.1.51-.07 1.58-.64 1.8-1.27.22-.62.22-1.16.16-1.27z" />
            </svg>
            WhatsApp
          </a>
        )}
      </div>
    </li>
  );
}

export default async function ClientesAdminPage() {
  const supabase = await createClient();

  // RLS deja al admin leer todos los usuarios. Mostramos solo los clientes.
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, email, telefono, created_at")
    .eq("rol", "cliente")
    .order("created_at", { ascending: false })
    .returns<ClienteRow[]>();

  const clientes = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
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
        <h1 className="mt-2 font-display text-3xl text-tinta sm:text-4xl">
          Clientes <span className="text-tinta-soft">({clientes.length})</span>
        </h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Escríbeles directo por WhatsApp con el botón verde.
        </p>
      </header>

      {clientes.length === 0 ? (
        <p className="tarjeta border-dashed p-6 text-center text-sm text-tinta-soft">
          Todavía no hay clientes registrados.
        </p>
      ) : (
        <ul className="entrada flex flex-col gap-4">
          {clientes.map((c) => (
            <Tarjeta key={c.id} c={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
