import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Tutorial = {
  id: number;
  titulo: string;
  portada_url: string | null;
};

export default async function TutorialesPage() {
  const supabase = await createClient();

  // RLS: el cliente solo ve los publicados.
  const { data } = await supabase
    .from("tutoriales")
    .select("id, titulo, portada_url")
    .eq("publicado", true)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Tutorial[]>();

  const tutoriales = data ?? [];
  const urlDe = (path: string | null) =>
    path ? supabase.storage.from("tutoriales").getPublicUrl(path).data.publicUrl : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="aparecer mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
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

      <header className="mb-8 aparecer">
        <h1 className="font-display text-3xl text-tinta">Tutoriales</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Guías para configurar tus apps y compartir tus links sin enredos.
        </p>
      </header>

      {tutoriales.length === 0 ? (
        <div className="tarjeta aparecer border-dashed p-10 text-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-tinta-soft"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p className="mt-3 text-tinta-soft">
            Todavía no hay tutoriales disponibles.
          </p>
        </div>
      ) : (
        <ul className="entrada grid gap-4 sm:grid-cols-2">
          {tutoriales.map((t) => {
            const portada = urlDe(t.portada_url);
            return (
              <li key={t.id}>
                <Link
                  href={`/tutoriales/${t.id}`}
                  className="tarjeta tarjeta-flota group block overflow-hidden p-0"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-white/[0.06]">
                    {portada && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={portada}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="p-4 font-medium text-tinta">{t.titulo}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
