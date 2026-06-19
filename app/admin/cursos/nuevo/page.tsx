import Link from "next/link";
import FormularioCurso from "./formulario-curso";

export default function NuevoCursoPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 aparecer">
        <Link
          href="/admin/cursos"
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
        <h1 className="mt-2 font-display text-3xl text-tinta">Nuevo curso</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Ponle nombre, una descripción y el precio.
        </p>
      </header>

      <FormularioCurso />
    </div>
  );
}
