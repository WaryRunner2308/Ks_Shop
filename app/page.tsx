import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import Logo from "@/app/components/logo";
import LogosFlotantes from "@/app/components/logos-flotantes";

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

  // La dueña va DIRECTO a su panel: el inicio es la vitrina para clientes.
  if (perfil?.rol === "admin") {
    redirect("/admin");
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden text-tinta">
      {/* Pétalos cayendo, como en el login */}
      <LogosFlotantes />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo height={48} priority />
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          {user ? (
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
              <form action={cerrarSesion}>
                <button type="submit" className="btn-linea px-4 py-2">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl border border-coral/40 bg-white/[0.08] px-5 py-2.5 font-semibold text-coral-dark shadow-[0_6px_18px_-6px_rgba(236,11,134,0.45)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-coral hover:bg-white/[0.14] hover:shadow-[0_10px_26px_-8px_rgba(236,11,134,0.55)]"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </header>

      <main className="entrada relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* Glow central: brillo blanco que se funde en rosa, da el "rosadito
            bonito" con dimensión detrás del titular. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[46rem] max-w-[125vw] -translate-x-1/2 -translate-y-10 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.75),rgba(255,123,194,0.28)_55%,transparent)] blur-2xl flotar"
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
                {perfil?.nombre || "qué gusto verte"}
              </span>
              .
            </>
          ) : (
            <>
              <span className="italic texto-fucsia">¡Lo que quieras,</span>
              <br />
              te lo conseguimos!
            </>
          )}
        </h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-tinta-soft">
          Tan fácil como:
        </p>
        <ol className="mt-3 max-w-sm space-y-1.5 text-left text-base text-tinta-soft">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">1</span>
            Cotiza tus productos
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">2</span>
            Completa tu pedido
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">3</span>
            Espera que llegue tu compra
          </li>
        </ol>

        <Link
          href={user ? "/cotizar" : "/registro"}
          className="btn-coral mt-8 px-7 py-3.5 text-base"
        >
          {user ? "Pedir una cotización" : "Crear cuenta"}
        </Link>

        {/* Plataformas con las que trabajamos */}
        <div className="mt-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-tinta-soft">
            Plataformas con las que trabajo
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm">
          {["AliExpress", "Shein", "Temu", "eBay", "Romwe", "Fashion Nova", "Dolls Kill", "Babyboo", "Beauty Creations"].map((p) => (
            <span
              key={p}
              className="btn-linea px-4 py-1.5 text-sm font-medium"
            >
              {p}
            </span>
          ))}
          </div>
        </div>
      </main>
    </div>
  );
}
