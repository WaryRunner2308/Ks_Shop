import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import Logo from "@/app/components/logo";
import CampanaNotificaciones, {
  type Notificacion,
} from "@/app/components/campana-notificaciones";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS: el cliente solo recibe SUS notificaciones (usuario_id = su id).
  const { data } = await supabase
    .from("notificaciones")
    .select("id, mensaje, leida, created_at")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<Notificacion[]>();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/60 bg-white/55 px-6 py-4 backdrop-blur-xl">
        <Logo height={40} priority />
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/"
            className="rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2"
          >
            Inicio
          </Link>
          <Link
            href="/cotizar"
            className="rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2"
          >
            Cotizar
          </Link>
          <Link
            href="/mis-solicitudes"
            className="rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2"
          >
            Mis solicitudes
          </Link>
          <CampanaNotificaciones
            inicial={data ?? []}
            canal="notis-cliente"
            filtro={`usuario_id=eq.${user.id}`}
          />
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-full border border-linea px-4 py-2 font-medium text-tinta transition hover:bg-crema-2"
            >
              Cerrar sesión
            </button>
          </form>
        </nav>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
