import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormularioPromo from "./formulario-promo";
import { eliminarPromocion } from "./actions";

type Promo = {
  id: number;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  activa: boolean;
  created_at: string;
};

export default async function AdminPromocionesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("promociones")
    .select("id, titulo, descripcion, imagen_url, activa, created_at")
    .order("created_at", { ascending: false })
    .returns<Promo[]>();

  const promociones = data ?? [];
  const urlDe = (path: string | null) =>
    path ? supabase.storage.from("promociones").getPublicUrl(path).data.publicUrl : null;

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
        <h1 className="mt-2 font-display text-3xl text-tinta">Promociones</h1>
        <p className="mt-2 text-sm text-tinta-soft">
          Publica ofertas y avísale a todos tus clientes al instante.
        </p>
      </header>

      <section className="mb-10 aparecer">
        <h2 className="mb-3 text-lg font-semibold text-tinta">Nueva promoción</h2>
        <FormularioPromo />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-tinta">
          Publicadas{" "}
          <span className="text-tinta-soft">({promociones.length})</span>
        </h2>
        {promociones.length === 0 ? (
          <p className="tarjeta border-dashed p-6 text-sm text-tinta-soft">
            Aún no has publicado promociones.
          </p>
        ) : (
          <ul className="entrada flex flex-col gap-3">
            {promociones.map((p) => {
              const img = urlDe(p.imagen_url);
              return (
                <li
                  key={p.id}
                  className="tarjeta tarjeta-flota flex items-start gap-4 p-4"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-2xl">
                      🎉
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-tinta">{p.titulo}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-tinta-soft">
                      {p.descripcion}
                    </p>
                  </div>
                  <form action={eliminarPromocion}>
                    <input type="hidden" name="id" value={p.id} />
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
      </section>
    </div>
  );
}
