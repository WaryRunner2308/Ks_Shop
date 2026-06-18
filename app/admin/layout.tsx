import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CampanaNotificaciones, {
  type Notificacion,
} from "@/app/components/campana-notificaciones";
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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/60 bg-white/55 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Logo href="/admin" height={40} priority />
          <span className="chip">Panel de la dueña</span>
        </div>
        <CampanaNotificaciones inicial={data ?? []} canal="notis-admin" />
      </header>

      <div className="flex-1">{children}</div>

      {/* Flecha para volver al inicio, abajo */}
      <footer className="px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-tinta transition hover:text-coral-dark"
        >
          <svg
            width="20"
            height="20"
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
          <span className="text-sm font-medium">Volver al inicio</span>
        </Link>
      </footer>
    </div>
  );
}
