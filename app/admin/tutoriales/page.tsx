import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eliminarTutorial } from "./actions";

type Tutorial = {
  id: number;
  titulo: string;
  portada_url: string | null;
  created_at: string;
};

export default async function AdminTutorialesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tutoriales")
    .select("id, titulo, portada_url, created_at")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Tutorial[]>();

  const tutoriales = data ?? [];
  const urlDe = (path: string | null) =>
    path ? supabase.storage.from("tutoriales").getPublicUrl(path).data.publicUrl : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 aparecer">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
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
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-tinta">Tutoriales</h1>
          <Link href="/admin/tutoriales/nuevo" className="btn-coral shrink-0 px-4 py-2.5 text-sm">
            Nuevo
          </Link>
        </div>
        <p className="mt-2 text-sm text-tinta-soft">
          Guías paso a paso que verán tus clientes.
        </p>
      </header>

      {tutoriales.length === 0 ? (
        <p className="tarjeta border-dashed p-6 text-sm text-tinta-soft">
          Aún no has creado tutoriales.
        </p>
      ) : (
        <ul className="entrada flex flex-col gap-3">
          {tutoriales.map((t) => {
            const portada = urlDe(t.portada_url);
            return (
              <li
                key={t.id}
                className="tarjeta tarjeta-flota flex items-center gap-4 p-4"
              >
                {portada ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={portada}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <span className="h-16 w-16 shrink-0 rounded-xl bg-white/[0.06]" />
                )}
                <p className="min-w-0 flex-1 truncate font-medium text-tinta">
                  {t.titulo}
                </p>
                <form action={eliminarTutorial}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-tinta-soft transition hover:bg-white/[0.06] hover:text-coral-dark"
                  >
                    Eliminar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
