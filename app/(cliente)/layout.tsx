import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import Logo from "@/app/components/logo";
import CampanaNotificaciones, {
  type Notificacion,
} from "@/app/components/campana-notificaciones";
import WizardPush from "@/app/components/wizard-push";
import LogosFlotantes from "@/app/components/logos-flotantes";

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
    <div className="relative isolate flex min-h-screen flex-col">
      <LogosFlotantes />
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl">
        <Logo height={40} priority />
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/"
            className="rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2"
          >
            Inicio
          </Link>
          <Link
            href="/mis-solicitudes"
            className="rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2"
          >
            Mis solicitudes
          </Link>
          <Link
            href="/tutoriales"
            className="hidden rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2 sm:inline-flex"
          >
            Tutoriales
          </Link>
          <Link
            href="/promociones"
            className="hidden rounded-full px-3 py-2 font-medium text-tinta transition hover:bg-crema-2 sm:inline-flex"
          >
            Promociones
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

      <WizardPush />

      <div className="flex-1">{children}</div>
    </div>
  );
}
