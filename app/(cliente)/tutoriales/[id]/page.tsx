import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Paso = {
  orden: number;
  descripcion: string;
  imagen_url: string | null;
};

export default async function TutorialDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorialId = Number(id);
  if (!Number.isInteger(tutorialId)) notFound();

  const supabase = await createClient();

  // RLS: solo devuelve el tutorial si está publicado (o si eres admin).
  const { data: tutorial } = await supabase
    .from("tutoriales")
    .select("id, titulo, portada_url")
    .eq("id", tutorialId)
    .single();
  if (!tutorial) notFound();

  const { data: pasosData } = await supabase
    .from("tutorial_pasos")
    .select("orden, descripcion, imagen_url")
    .eq("tutorial_id", tutorialId)
    .order("orden", { ascending: true })
    .returns<Paso[]>();

  const pasos = pasosData ?? [];
  const urlDe = (path: string | null) =>
    path ? supabase.storage.from("tutoriales").getPublicUrl(path).data.publicUrl : null;
  const portada = urlDe(tutorial.portada_url);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/tutoriales"
        className="aparecer mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[#1c0618] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
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
        Volver a tutoriales
      </Link>

      <header className="mb-8 aparecer">
        {portada && (
          <div className="mb-5 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#20091c] ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portada} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <h1 className="font-display text-3xl text-tinta">{tutorial.titulo}</h1>
      </header>

      {pasos.length === 0 ? (
        <p className="tarjeta border-dashed p-6 text-sm text-tinta-soft">
          Este tutorial todavía no tiene pasos.
        </p>
      ) : (
        <ol className="entrada flex flex-col gap-5">
          {pasos.map((p) => {
            const img = urlDe(p.imagen_url);
            return (
              <li key={p.orden} className="tarjeta p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
                    {p.orden}
                  </span>
                  <p className="whitespace-pre-line pt-0.5 text-sm leading-relaxed text-tinta">
                    {p.descripcion}
                  </p>
                </div>
                {img && (
                  <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full object-cover" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
