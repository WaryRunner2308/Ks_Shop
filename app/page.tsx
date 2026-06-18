import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si hay sesión, leemos el perfil para saludar y conocer el rol.
  let perfil: { nombre: string | null; rol: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("usuarios")
      .select("nombre, rol")
      .eq("id", user.id)
      .single();
    perfil = data;
  }

  return (
    <div className="flex min-h-screen flex-col text-tinta">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-xl tracking-tight">
          K&apos;s<span className="text-coral">.</span>Shop
        </span>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          {user ? (
            <>
              {perfil?.rol === "admin" ? (
                <Link
                  href="/admin"
                  className="btn-linea px-4 py-2 font-semibold"
                >
                  Panel
                </Link>
              ) : (
                <>
                  <Link href="/cotizar" className="btn-coral px-4 py-2">
                    Cotizar
                  </Link>
                  <Link
                    href="/mis-solicitudes"
                    className="rounded-full px-4 py-2 font-medium transition hover:bg-crema-2"
                  >
                    Mis solicitudes
                  </Link>
                </>
              )}
              <form action={cerrarSesion}>
                <button type="submit" className="btn-linea px-4 py-2">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 font-medium transition hover:bg-crema-2"
              >
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn-coral px-4 py-2">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="entrada flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-linea bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-coral backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-coral latido" />
          Compras bajo pedido
        </p>
        <h1 className="max-w-2xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          {user ? (
            <>
              Hola,{" "}
              <span className="italic text-coral-dark">
                {perfil?.nombre || "bienvenida"}
              </span>
              .
            </>
          ) : (
            <>
              Lo que quieres,
              <br />
              <span className="italic text-coral-dark">pedido por nosotras.</span>
            </>
          )}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-tinta-soft">
          Cotiza, paga y recibe tus compras de AliExpress, Shein y Alibaba sin
          complicaciones. El precio del envío internacional se notificará cuando
          el paquete llegue al país.
        </p>

        {!user ? (
          <Link href="/registro" className="btn-coral mt-8 px-7 py-3.5 text-base">
            Pedir una cotización
          </Link>
        ) : (
          perfil?.rol !== "admin" && (
            <Link href="/cotizar" className="btn-coral mt-8 px-7 py-3.5 text-base">
              Pedir una cotización
            </Link>
          )
        )}

        {/* Plataformas con las que trabajamos */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 text-sm text-tinta-soft">
          {["AliExpress", "Shein", "Alibaba"].map((p) => (
            <span
              key={p}
              className="rounded-full border border-linea bg-white/60 px-4 py-1.5 font-medium backdrop-blur transition hover:border-coral hover:text-tinta"
            >
              {p}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
