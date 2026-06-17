import Link from "next/link";

// Layout compartido de login y registro: panel de marca a la izquierda,
// formulario a la derecha. En móvil solo se ve el formulario con el logo arriba.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-crema lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <aside className="panel-marca grano relative hidden flex-col justify-between overflow-hidden p-12 text-crema lg:flex">
        <Link
          href="/"
          className="relative z-10 font-display text-2xl tracking-tight text-crema"
        >
          K&apos;s Shop
        </Link>

        <div className="relative z-10 aparecer">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-coral">
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
          <span className="rounded-full border border-crema/20 px-3 py-1">
            AliExpress
          </span>
          <span className="rounded-full border border-crema/20 px-3 py-1">
            Shein
          </span>
          <span className="rounded-full border border-crema/20 px-3 py-1">
            Alibaba
          </span>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm aparecer">
          {/* Logo visible en móvil */}
          <Link
            href="/"
            className="mb-10 block text-center font-display text-2xl tracking-tight text-tinta lg:hidden"
          >
            K&apos;s Shop
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
