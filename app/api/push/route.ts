import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Este endpoint lo llama un trigger de Postgres (pg_net) cuando se inserta una
// notificación. Envía el aviso Web Push a los dispositivos del destinatario.
// Corre en Node (web-push no funciona en el runtime edge).
export const runtime = "nodejs";

type Cuerpo = {
  id?: number;
  usuario_id?: string | null;
  mensaje?: string;
};

// Cliente con service-role: lee TODAS las suscripciones (omite RLS). La clave es
// secreta y solo existe en el servidor.
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: Request) {
  // 1) Verificar que la llamada viene de nuestro trigger (secreto compartido).
  const secreto = req.headers.get("x-webhook-secret");
  if (!secreto || secreto !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  // 2) Configurar VAPID.
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:soporte@ks-shop.app";
  if (!publica || !privada) {
    return NextResponse.json({ error: "faltan VAPID" }, { status: 500 });
  }
  webpush.setVapidDetails(subject, publica, privada);

  const { usuario_id, mensaje }: Cuerpo = await req.json().catch(() => ({}));
  const supabase = supabaseAdmin();

  // 3) ¿A qué dispositivos enviamos?
  //    usuario_id NULL  -> es para la dueña (admin): sus dispositivos.
  //    usuario_id valor -> ese cliente: sus dispositivos.
  let idsDestino: string[] = [];
  if (usuario_id) {
    idsDestino = [usuario_id];
  } else {
    const { data: admins } = await supabase
      .from("usuarios")
      .select("id")
      .eq("rol", "admin");
    idsDestino = (admins ?? []).map((a) => a.id as string);
  }

  if (idsDestino.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("usuario_id", idsDestino);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  const payload = JSON.stringify({
    title: "K's Shop",
    body: mensaje || "Tienes una notificación nueva.",
    url: usuario_id ? "/mis-solicitudes" : "/admin",
  });

  // 4) Enviar a cada dispositivo. Limpiar las suscripciones expiradas (404/410).
  let enviados = 0;
  const expiradas: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint as string,
            keys: { p256dh: s.p256dh as string, auth: s.auth as string },
          },
          payload,
        );
        enviados++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          expiradas.push(s.endpoint as string);
        }
      }
    }),
  );

  if (expiradas.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiradas);
  }

  return NextResponse.json({ ok: true, enviados });
}
