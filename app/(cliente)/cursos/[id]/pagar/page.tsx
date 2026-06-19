import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormularioPagoCurso from "./formulario-pago-curso";

type Metodo = {
  id: number;
  tipo: string;
  detalles: Record<string, string>;
};

export default async function PagarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cursoId = Number(id);
  if (!Number.isInteger(cursoId)) notFound();

  const supabase = await createClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nombre, precio, publicado")
    .eq("id", cursoId)
    .single();
  if (!curso || !curso.publicado) notFound();

  // Si ya hay un pago en proceso o confirmado, no dejamos pagar de nuevo.
  const { data: pagoPrevio } = await supabase
    .from("cursos_pagos")
    .select("estado")
    .eq("curso_id", cursoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    pagoPrevio?.estado === "verificado" ||
    pagoPrevio?.estado === "registrado"
  ) {
    redirect(`/cursos/${cursoId}`);
  }

  // Teléfono del admin (para los avisos de WhatsApp de Pago Móvil / Divisas).
  const { data: telefonoAdmin } = await supabase.rpc("telefono_admin");

  // Métodos de pago activos.
  const { data: metodos } = await supabase
    .from("metodos_pago")
    .select("id, tipo, detalles")
    .eq("activo", true)
    .order("created_at", { ascending: true })
    .returns<Metodo[]>();

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-6">
        <Link
          href={`/cursos/${curso.id}`}
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
          Volver al curso
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta">Pagar curso</h1>
        <p className="mt-1 text-sm text-tinta-soft">{curso.nombre}</p>
      </header>

      <FormularioPagoCurso
        cursoId={curso.id}
        cursoNombre={curso.nombre}
        precio={Number(curso.precio)}
        metodos={metodos ?? []}
        adminTelefono={telefonoAdmin ?? null}
      />
    </div>
  );
}
