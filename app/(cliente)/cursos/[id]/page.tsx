import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enlaceWhatsAppMensaje } from "@/lib/telefono";

type Curso = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
};

// Logo simple de WhatsApp.
function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 0 0 1.69 5.522l-.999 3.648 3.808-.999zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cursoId = Number(id);
  if (!Number.isInteger(cursoId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS: solo cursos publicados (o admin).
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nombre, descripcion, precio")
    .eq("id", cursoId)
    .single<Curso>();
  if (!curso) notFound();

  // Pago más reciente del cliente para este curso.
  let estadoPago: string | null = null;
  if (user) {
    const { data: pago } = await supabase
      .from("cursos_pagos")
      .select("estado")
      .eq("curso_id", cursoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    estadoPago = pago?.estado ?? null;
  }

  const pagado = estadoPago === "verificado";
  const pendiente = estadoPago === "registrado";

  // Datos para el botón de WhatsApp (solo si ya está pagado).
  let linkWa: string | null = null;
  if (pagado && user) {
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("nombre")
      .eq("id", user.id)
      .single();
    const { data: telefonoAdmin } = await supabase.rpc("telefono_admin");
    if (telefonoAdmin) {
      const nombre = perfil?.nombre?.trim() || "un cliente";
      const mensaje = `Hola, mi nombre es ${nombre} y pagué el curso «${curso.nombre}».`;
      linkWa = enlaceWhatsAppMensaje(telefonoAdmin, mensaje);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link
        href="/cursos"
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
        Cursos
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-3xl text-tinta">{curso.nombre}</h1>
        <p className="mt-2 font-display text-3xl text-coral-dark">
          ${Number(curso.precio).toFixed(2)}
        </p>
      </header>

      <div className="tarjeta p-5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-tinta-soft">
          {curso.descripcion}
        </p>
      </div>

      {/* Estado / acción */}
      <div className="mt-6">
        {pagado ? (
          <div className="tarjeta border-emerald-400/30 bg-emerald-400/[0.06] p-5 text-center">
            <p className="font-display text-2xl text-tinta">¡Curso pagado!</p>
            <p className="mt-2 text-sm text-tinta-soft">
              Tu pago fue confirmado. Escríbele a la dueña por WhatsApp para
              coordinar el acceso a tu curso.
            </p>
            {linkWa ? (
              <a
                href={linkWa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1ebe5a]"
              >
                <IconoWhatsApp />
                Escribir por WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-xs text-tinta-soft">
                (El WhatsApp aún no está configurado.)
              </p>
            )}
          </div>
        ) : pendiente ? (
          <div className="tarjeta border-coral/25 p-5 text-center">
            <p className="font-medium text-tinta">Estamos verificando tu pago</p>
            <p className="mt-2 text-sm text-tinta-soft">
              En cuanto la dueña lo confirme, te avisaremos y aquí aparecerá el
              botón de WhatsApp.
            </p>
          </div>
        ) : (
          <>
            {estadoPago === "rechazado" && (
              <p className="mb-3 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-dark">
                Tu pago anterior fue rechazado. Puedes intentarlo de nuevo.
              </p>
            )}
            <Link
              href={`/cursos/${curso.id}/pagar`}
              className="btn-coral w-full justify-center px-4 py-3.5 text-base"
            >
              Pagar curso
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
