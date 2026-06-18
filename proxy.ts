import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Páginas públicas (cualquiera puede entrar sin iniciar sesión).
const RUTAS_PUBLICAS = ["/", "/login", "/registro", "/recuperar"];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Las rutas de autenticación (confirmación de correo, etc.) siempre pasan.
  if (pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // Zona de administración: solo la dueña (rol "admin").
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return redirigir("/login", request, supabaseResponse);
    }
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (perfil?.rol !== "admin") {
      // Tiene sesión pero no es admin: lo mandamos al inicio.
      return redirigir("/", request, supabaseResponse);
    }
    return supabaseResponse;
  }

  // Cualquier otra ruta que NO sea pública requiere sesión iniciada (zona cliente).
  const esPublica = RUTAS_PUBLICAS.includes(pathname);
  if (!esPublica && !user) {
    return redirigir("/login", request, supabaseResponse);
  }

  return supabaseResponse;
}

// Redirige conservando las cookies de sesión ya refrescadas.
function redirigir(
  destino: string,
  request: NextRequest,
  respuesta: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  const redireccion = NextResponse.redirect(url);
  respuesta.cookies.getAll().forEach((cookie) => {
    redireccion.cookies.set(cookie.name, cookie.value);
  });
  return redireccion;
}

export const config = {
  // Se ejecuta en todas las rutas excepto: archivos estáticos, imágenes, los
  // archivos públicos de la PWA (manifest, service worker e íconos) y las rutas
  // de API (`/api/*`). Si no se excluyen, el middleware los redirige a /login.
  // En particular, /api/push lo llama el servidor (pg_net) SIN sesión de
  // usuario; el propio endpoint valida su secreto, así que no debe pasar por
  // aquí (antes lo rebotaba a /login y los avisos push nunca se enviaban).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|api/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
