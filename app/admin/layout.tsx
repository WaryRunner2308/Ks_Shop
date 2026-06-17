import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CampanaNotificaciones, {
  type Notificacion,
} from "./campana-notificaciones";

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
    <div className="min-h-screen bg-crema">
      <header className="flex items-center justify-between border-b border-linea bg-white px-6 py-4">
        <Link href="/admin" className="font-display text-xl text-tinta">
          K&apos;s Shop · Admin
        </Link>
        <CampanaNotificaciones inicial={data ?? []} />
      </header>
      {children}
    </div>
  );
}
