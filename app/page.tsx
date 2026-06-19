import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/auth/actions";
import Logo from "@/app/components/logo";
import LogosFlotantes from "@/app/components/logos-flotantes";
import WizardPush from "@/app/components/wizard-push";
import PlataformasCliente from "@/app/components/plataformas-cliente";
import CampanaNotificaciones, {
  type Notificacion,
} from "@/app/components/campana-notificaciones";
import { ESTADO_ETIQUETA, etiquetaPlataforma, TIPO_ETIQUETA } from "@/lib/constantes";

type Solicitud = {
  id: number;
  plataforma: string;
  url_producto: string;
  variante: string | null;
  precio_venta: number | null;
  estado: string;
  created_at: string;
  tipo: string;
};

// Estilo del estado de cada solicitud (color = significado).
const ESTADO_ESTILO: Record<string, { clase: string; punto: string }> = {
  solicitado: { clase: "bg-amber-400/12 text-amber-300", punto: "bg-amber-400" },
  cotizado: { clase: "bg-coral/15 text-coral-dark", punto: "bg-coral" },
  pagado: { clase: "bg-emerald-400/12 text-emerald-300", punto: "bg-emerald-400" },
  confirmado: { clase: "bg-emerald-400/15 text-emerald-300", punto: "bg-emerald-400" },
  cancelado: { clase: "bg-white/8 text-tinta-soft", punto: "bg-tinta-soft" },
};

function ChipEstado({ estado }: { estado: string }) {
  const e = ESTADO_ESTILO[estado] ?? ESTADO_ESTILO.cancelado;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${e.clase}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {ESTADO_ETIQUETA[estado] ?? estado}
    </span>
  );
}

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

  // La dueña va DIRECTO a su panel.
  if (perfil?.rol === "admin") {
    redirect("/admin");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CLIENTE CON SESIÓN → inicio personal (panel), distinto del landing público.
  // ──────────────────────────────────────────────────────────────────────────
  if (user) {
    const { data } = await supabase
      .from("presupuestos")
      .select(
        "id, plataforma, url_producto, variante, precio_venta, estado, created_at, tipo",
      )
      .order("created_at", { ascending: false })
      .returns<Solicitud[]>();

    const solicitudes = data ?? [];

    // Notificaciones del cliente (para la campana del inicio). RLS: solo las suyas.
    const { data: notis } = await supabase
      .from("notificaciones")
      .select("id, mensaje, leida, created_at")
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<Notificacion[]>();

    // Las confirmadas salen del inicio y van a su propia página.
    const activas = solicitudes.filter((s) => s.estado !== "confirmado");
    const recientes = activas.slice(0, 3);
    const pendientes = activas.filter(
      (s) => s.estado === "solicitado",
    ).length;
    const conPrecio = activas.filter(
      (s) => s.estado === "cotizado" || s.estado === "pagado",
    ).length;
    const nombre = perfil?.nombre?.split(" ")[0] || "qué gusto verte";

    return (
      <div className="relative isolate flex min-h-screen flex-col text-tinta">
        <LogosFlotantes />
        <WizardPush />
        {/* Brillo ambiental sutil arriba, detrás del saludo. */}
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[26rem] w-[44rem] max-w-[120vw] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,rgba(236,11,134,0.22),transparent)] blur-2xl"
        />

        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Logo height={38} priority />
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/mis-solicitudes"
              className="hidden rounded-full px-3 py-2 font-medium text-tinta-soft transition hover:text-tinta sm:inline-flex"
            >
              Mis solicitudes
            </Link>
            <CampanaNotificaciones
              inicial={notis ?? []}
              canal="notis-cliente-inicio"
              filtro={`usuario_id=eq.${user.id}`}
            />
            <form action={cerrarSesion}>
              <button type="submit" className="btn-linea px-4 py-2 text-sm">
                Cerrar sesión
              </button>
            </form>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-2 sm:px-8">
          {/* Saludo */}
          <section className="aparecer">
            <p className="chip mb-4 px-4 py-1.5 text-xs uppercase tracking-[0.2em]">
              <span className="h-1.5 w-1.5 rounded-full bg-coral latido" />
              Tu espacio
            </p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Hola, <span className="italic texto-fucsia">{nombre}</span>
            </h1>
            <p className="mt-3 text-tinta-soft">
              ¿Qué quieres conseguir hoy?
            </p>
          </section>

          {/* Acción principal + resumen */}
          <section className="entrada mt-8 grid gap-4 sm:grid-cols-5">
            {/* Tarjeta grande: pedir cotización */}
            <Link
              href="/cotizar"
              className="panel-marca grano group relative overflow-hidden rounded-3xl p-6 sm:col-span-3"
              style={{ boxShadow: "var(--sombra-flota)" }}
            >
              <div className="relative z-10 flex h-full flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Nuevo pedido
                </p>
                <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">
                  Pedir una cotización
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/80">
                  Pega el link de lo que quieres y te enviamos el precio.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-1">
                  Empezar
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Resumen rápido (clicable: lleva a las solicitudes filtradas) */}
            <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-1">
              <Link
                href="/mis-solicitudes?filtro=espera"
                className="tarjeta tarjeta-flota flex flex-col justify-center p-5"
              >
                <p className="font-display text-3xl text-tinta">{pendientes}</p>
                <p className="mt-1 text-xs font-medium text-tinta-soft">
                  En espera de precio
                </p>
              </Link>
              <Link
                href="/mis-solicitudes?filtro=cotizadas"
                className="tarjeta tarjeta-flota flex flex-col justify-center p-5"
              >
                <p className="font-display text-3xl texto-fucsia">{conPrecio}</p>
                <p className="mt-1 text-xs font-medium text-tinta-soft">
                  Ya cotizadas
                </p>
              </Link>
            </div>
          </section>

          {/* Solicitudes recientes */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-tinta">
                Tus solicitudes
              </h2>
              {solicitudes.length > 0 && (
                <Link
                  href="/mis-solicitudes"
                  className="inline-flex items-center gap-1 text-sm font-medium text-coral-dark transition hover:gap-2"
                >
                  Ver todas
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
            </div>

            {solicitudes.length === 0 ? (
              <div className="tarjeta border-dashed p-8 text-center">
                <p className="text-tinta-soft">
                  Aún no tienes solicitudes.
                  <br />
                  Es tan fácil como:
                </p>
                <ol className="mx-auto mt-4 flex max-w-xs flex-col gap-2 text-left text-sm text-tinta-soft">
                  {[
                    "Cotiza tus productos",
                    "Completa tu pedido",
                    "Espera que llegue tu compra",
                  ].map((paso, i) => (
                    <li key={paso} className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      {paso}
                    </li>
                  ))}
                </ol>
                <Link
                  href="/cotizar"
                  className="btn-coral mt-6 px-5 py-2.5 text-sm"
                >
                  Pedir mi primera cotización
                </Link>
              </div>
            ) : (
              <ul className="entrada flex flex-col gap-3">
                {recientes.map((s) => {
                  const tienePrecio =
                    s.precio_venta != null &&
                    (s.estado === "cotizado" || s.estado === "pagado");
                  // Si ya está cotizada con precio, el siguiente paso es pagar.
                  const puedePagar =
                    s.estado === "cotizado" && s.precio_venta != null;
                  const destino = puedePagar
                    ? `/pagar/${s.id}`
                    : "/mis-solicitudes";
                  return (
                    <li key={s.id}>
                      <Link
                        href={destino}
                        className="tarjeta tarjeta-flota flex items-center justify-between gap-3 p-4"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate font-medium text-tinta">
                            {etiquetaPlataforma(s.plataforma)}
                            {s.tipo === "carrito" && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-coral/15 px-2 py-0.5 text-[0.65rem] font-semibold text-coral-dark">
                                {TIPO_ETIQUETA.carrito}
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-tinta-soft">
                            {s.tipo === "carrito"
                              ? s.url_producto
                              : s.variante || s.url_producto}
                          </p>
                          {puedePagar && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-coral-dark">
                              Pagar ahora
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14M13 6l6 6-6 6" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {tienePrecio && (
                            <span className="font-display text-lg text-coral-dark">
                              ${Number(s.precio_venta).toFixed(2)}
                            </span>
                          )}
                          <ChipEstado estado={s.estado} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Accesos: tutoriales y promociones */}
          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/tutoriales"
              className="tarjeta tarjeta-flota flex items-center gap-3 p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-coral-dark">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-medium text-tinta">Tutoriales</p>
                <p className="truncate text-xs text-tinta-soft">
                  Aprende a compartir tus links
                </p>
              </div>
            </Link>
            <Link
              href="/promociones"
              className="tarjeta tarjeta-flota flex items-center gap-3 p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-coral-dark">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <path d="M7 7h.01" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-medium text-tinta">Promociones</p>
                <p className="truncate text-xs text-tinta-soft">
                  Ofertas y novedades
                </p>
              </div>
            </Link>
          </section>

          {/* Plataformas */}
          <PlataformasCliente />
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VISITANTE (sin sesión) → landing público de marketing.
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden text-tinta">
      {/* Logos de plataformas flotando */}
      <LogosFlotantes />

      <header className="relative z-10 flex items-center justify-end px-6 py-5 sm:px-10">
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/login"
            className="rounded-2xl border border-coral/40 bg-[#241022] px-5 py-2.5 font-semibold text-coral-dark shadow-[0_6px_18px_-6px_rgba(236,11,134,0.45)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-coral hover:bg-[#311630] hover:shadow-[0_10px_26px_-8px_rgba(236,11,134,0.55)]"
          >
            Iniciar sesión
          </Link>
        </nav>
      </header>

      <main className="entrada relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
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
          <span className="italic texto-fucsia">¡Lo que quieras,</span>
          <br />
          te lo conseguimos!
        </h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-tinta-soft">
          Tan fácil como:
        </p>
        <ol className="mt-3 max-w-sm space-y-1.5 text-left text-base text-tinta-soft">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">
              1
            </span>
            Cotiza tus productos
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">
              2
            </span>
            Completa tu pedido
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">
              3
            </span>
            Espera que llegue tu compra
          </li>
        </ol>

        <Link href="/registro" className="btn-coral mt-8 px-7 py-3.5 text-base">
          Crear cuenta
        </Link>

        <div className="mt-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-tinta-soft">
            Plataformas con las que trabajo
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm">
            {[
              "AliExpress",
              "Shein",
              "Temu",
              "eBay",
              "Romwe",
              "Fashion Nova",
              "Dolls Kill",
              "Babyboo",
              "Beauty Creations",
            ].map((p) => (
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
