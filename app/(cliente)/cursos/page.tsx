import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Curso = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
};

export default async function CursosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS: el cliente solo ve los cursos publicados.
  const { data: cursosData } = await supabase
    .from("cursos")
    .select("id, nombre, descripcion, precio, imagen_url")
    .eq("publicado", true)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Curso[]>();
  const cursos = cursosData ?? [];
  const urlFoto = (path: string | null) =>
    path
      ? supabase.storage.from("cursos").getPublicUrl(path).data.publicUrl
      : null;

  // Estado de pago del cliente por curso (su pago más reciente).
  const estadoPorCurso = new Map<number, string>();
  if (user && cursos.length > 0) {
    const { data: pagos } = await supabase
      .from("cursos_pagos")
      .select("curso_id, estado, created_at")
      .order("created_at", { ascending: false })
      .returns<{ curso_id: number; estado: string; created_at: string }[]>();
    for (const p of pagos ?? []) {
      if (!estadoPorCurso.has(p.curso_id)) {
        estadoPorCurso.set(p.curso_id, p.estado);
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
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
        Volver
      </Link>

      <header className="mb-8 aparecer">
        <h1 className="font-display text-3xl text-tinta">Cursos</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Aprende con los cursos de K&apos;s Shop.
        </p>
      </header>

      {cursos.length === 0 ? (
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
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <p className="mt-3 text-tinta-soft">
            Todavía no hay cursos disponibles.
          </p>
        </div>
      ) : (
        <ul className="entrada flex flex-col gap-4">
          {cursos.map((c) => {
            const estado = estadoPorCurso.get(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/cursos/${c.id}`}
                  className="tarjeta tarjeta-flota group block overflow-hidden p-0"
                >
                  {urlFoto(c.imagen_url) && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-[#20091c]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlFoto(c.imagen_url)!}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 font-display text-xl text-tinta">
                        {c.nombre}
                      </h2>
                      <span className="shrink-0 font-display text-xl text-coral-dark">
                        ${Number(c.precio).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-tinta-soft">
                      {c.descripcion}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-coral-dark">
                      {estado === "verificado"
                        ? "Curso pagado"
                        : estado === "registrado"
                          ? "Verificando tu pago"
                          : "Ver curso"}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
