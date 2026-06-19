import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Promo = {
  id: number;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  created_at: string;
};

export default async function PromocionesPage() {
  const supabase = await createClient();

  // RLS: el cliente solo ve las promociones activas.
  const { data } = await supabase
    .from("promociones")
    .select("id, titulo, descripcion, imagen_url, created_at")
    .eq("activa", true)
    .order("created_at", { ascending: false })
    .returns<Promo[]>();

  const promociones = data ?? [];
  const urlDe = (path: string | null) =>
    path ? supabase.storage.from("promociones").getPublicUrl(path).data.publicUrl : null;

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
        <h1 className="font-display text-3xl text-tinta">Promociones</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Ofertas y novedades de K&apos;s Shop.
        </p>
      </header>

      {promociones.length === 0 ? (
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
            <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <path d="M7 7h.01" />
          </svg>
          <p className="mt-3 text-tinta-soft">
            No hay promociones activas en este momento.
          </p>
        </div>
      ) : (
        <ul className="entrada flex flex-col gap-5">
          {promociones.map((p) => {
            const img = urlDe(p.imagen_url);
            return (
              <li key={p.id} className="tarjeta overflow-hidden p-0">
                {img && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#20091c]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-display text-xl text-coral-dark">
                    {p.titulo}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tinta-soft">
                    {p.descripcion}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
