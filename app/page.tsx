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
    <div className="flex min-h-screen flex-col bg-crema text-tinta">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-xl tracking-tight">K&apos;s Shop</span>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              {perfil?.rol === "admin" && (
                <Link
                  href="/admin"
                  className="font-semibold text-coral-dark hover:underline"
                >
                  Panel
                </Link>
              )}
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="rounded-full border border-linea px-4 py-2 font-medium transition hover:bg-crema-2"
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 font-medium hover:bg-crema-2"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-coral px-4 py-2 font-semibold text-white transition hover:bg-coral-dark"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-coral">
          Compras bajo pedido
        </p>
        <h1 className="max-w-2xl font-display text-5xl italic leading-tight sm:text-6xl">
          {user
            ? `Hola, ${perfil?.nombre || "bienvenida"}.`
            : "Lo que quieres, pedido por nosotras."}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-tinta-soft">
          Cotiza, paga y recibe tus compras de AliExpress, Shein y Alibaba sin
          complicaciones. El precio del envío internacional se notificará cuando
          el paquete llegue al país.
        </p>
        {!user && (
          <Link
            href="/registro"
            className="mt-8 rounded-xl bg-coral px-7 py-3.5 font-semibold text-white transition hover:bg-coral-dark"
          >
            Pedir una cotización
          </Link>
        )}
      </main>
    </div>
  );
}
