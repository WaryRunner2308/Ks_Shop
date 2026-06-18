import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CampanaNotificaciones, {
  type Notificacion,
} from "@/app/components/campana-notificaciones";

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
    <div className="flex min-h-screen flex-col bg-crema">
      <header className="flex items-center justify-between border-b border-linea bg-white px-6 py-4">
        <Link href="/admin" className="font-display text-xl text-tinta">
          K&apos;s Shop · Admin
        </Link>
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
