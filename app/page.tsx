import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import Logo from "@/app/components/logo";

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
        <Logo height={48} priority />
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

      <main className="entrada relative flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* Nubecitas flotantes decorativas detrás del titular */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-[34rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-white/50 blur-3xl flotar"
        />
        <div className="flotar mb-2">
          <Logo href={null} height={150} priority />
        </div>
        <p className="chip mb-6 px-4 py-1.5 text-xs uppercase tracking-[0.2em]">
          <span className="h-1.5 w-1.5 rounded-full bg-coral latido" />
          Compras bajo pedido
        </p>
        <h1 className="max-w-2xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          {user ? (
            <>
              Hola,{" "}
              <span className="italic texto-fucsia">
                {perfil?.nombre || "bienvenida"}
              </span>
              .
            </>
          ) : (
            <>
              Lo que quieres,
              <br />
              <span className="italic texto-fucsia">pedido por nosotras.</span>
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
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 text-sm">
          {["AliExpress", "Shein", "Alibaba"].map((p) => (
            <span
              key={p}
              className="btn-linea px-4 py-1.5 text-sm font-medium"
            >
              {p}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
