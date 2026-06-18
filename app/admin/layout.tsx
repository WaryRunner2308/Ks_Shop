import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import CampanaNotificaciones, {
  type Notificacion,
} from "@/app/components/campana-notificaciones";
import WizardPush from "@/app/components/wizard-push";
import LogosFlotantes from "@/app/components/logos-flotantes";
import Logo from "@/app/components/logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // RLS: solo el admin lee las notificaciones. Traemos las más recientes.
  const { data } = await supabase
    .from("notificaciones")
    .select("id, mensaje, leida, created_at")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<Notificacion[]>();

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <LogosFlotantes />
      <header
        className="sticky top-3 z-30 mx-3 flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/40 px-5 py-3 backdrop-blur-xl sm:mx-4 sm:px-6"
        style={{ boxShadow: "var(--sombra-media)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/admin" height={40} priority />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <CampanaNotificaciones inicial={data ?? []} canal="notis-admin" />
          <form action={cerrarSesion}>
            <button type="submit" className="btn-linea px-4 py-2 text-sm">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <WizardPush />

      <div className="flex-1">{children}</div>

      {/* Firma de marca al pie (el inicio del admin ES este panel). */}
      <footer className="px-6 py-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-tinta-soft">
          K&apos;s Shop · Panel de la dueña
        </p>
      </footer>
    </div>
  );
}
