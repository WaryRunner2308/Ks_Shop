import Link from "next/link";
import Logo from "@/app/components/logo";

// Layout compartido de login y registro: panel de marca a la izquierda,
// formulario a la derecha. En móvil solo se ve el formulario con el logo arriba.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <aside className="panel-marca grano relative hidden flex-col justify-between overflow-hidden p-12 text-crema lg:flex">
        {/* Monograma gigante de marca, como marca de agua decorativa */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-10 select-none font-display text-[22rem] italic leading-none text-crema/[0.05]"
        >
          K
        </span>

        <div className="relative z-10">
          <Logo href="/" height={56} plate priority />
        </div>

        <div className="relative z-10 aparecer">
          <p className="mb-5 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-coral">
            <span className="h-1.5 w-1.5 rounded-full bg-coral latido" />
            Compras bajo pedido
          </p>
          <h1 className="font-display text-5xl italic leading-[1.05] text-crema xl:text-6xl">
            Lo que quieres,
            <br />
            pedido por
            <br />
            nosotras.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-crema/70">
            Cotiza, paga y recibe tus compras de AliExpress, Shein y Alibaba —
            todo desde un solo lugar, sin complicaciones.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-crema/60">
          {["AliExpress", "Shein", "Alibaba"].map((p) => (
            <span
              key={p}
              className="rounded-full border border-crema/20 px-3 py-1 transition hover:border-coral/60 hover:text-crema"
            >
              {p}
            </span>
          ))}
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm aparecer">
          {/* Logo visible en móvil */}
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo href="/" height={84} priority />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
