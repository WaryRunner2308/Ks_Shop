import type { Viewport } from "next";
import Link from "next/link";
import Logo from "@/app/components/logo";
import LogosFlotantes from "@/app/components/logos-flotantes";

export const viewport: Viewport = {
  themeColor: "#0a000e",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="escena-auth">
      {/* Flecha para volver al inicio */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 sm:left-6 sm:top-6"
      >
        <svg
          width="18"
          height="18"
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
        Inicio
      </Link>

      {/* Logos flotantes de plataformas */}
      <LogosFlotantes />

      {/* Tarjeta central con el formulario */}
      <main className="surgir relative z-10 w-full max-w-[27rem]">
        <span aria-hidden className="halo-auth" />
        <div className="tarjeta-auth">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="flotar">
              <Logo href="/" height={92} priority />
            </div>
          </div>

          {children}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-tinta-soft">
            <span>AliExpress</span>
            <span className="text-coral">·</span>
            <span>Shein</span>
            <span className="text-coral">·</span>
            <span>Temu</span>
            <span className="text-coral">·</span>
            <span>eBay</span>
            <span className="text-coral">·</span>
            <span>Romwe</span>
            <span className="text-coral">·</span>
            <span>Fashion Nova</span>
          </div>
        </div>
      </main>
    </div>
  );
}
