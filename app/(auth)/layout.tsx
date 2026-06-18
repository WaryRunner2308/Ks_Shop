import Logo from "@/app/components/logo";

// Escena inmersiva "Aurora de pétalos": aurora fucsia en movimiento, orbes de
// luz que ascienden, pétalos cayendo y una tarjeta de vidrio luminoso al centro
// que contiene el formulario (login o registro).

// Pétalos: posiciones, tamaños, ritmos y deriva fijos (deterministas para no
// romper la hidratación de React).
const petalos = [
  { left: 6, size: 12, dur: 11, delay: 0, drift: 9, claro: true },
  { left: 14, size: 16, dur: 14, delay: 3, drift: 6, claro: false },
  { left: 22, size: 10, dur: 9, delay: 1.5, drift: 12, claro: false },
  { left: 30, size: 18, dur: 16, delay: 5, drift: 4, claro: true },
  { left: 38, size: 13, dur: 12, delay: 2, drift: 10, claro: false },
  { left: 46, size: 11, dur: 10, delay: 6, drift: 7, claro: true },
  { left: 54, size: 17, dur: 15, delay: 1, drift: -5, claro: false },
  { left: 62, size: 12, dur: 13, delay: 4, drift: 8, claro: true },
  { left: 70, size: 15, dur: 11, delay: 7, drift: -8, claro: false },
  { left: 78, size: 10, dur: 9.5, delay: 2.5, drift: 6, claro: true },
  { left: 86, size: 16, dur: 14.5, delay: 5.5, drift: -6, claro: false },
  { left: 92, size: 12, dur: 12.5, delay: 0.8, drift: 9, claro: true },
  { left: 18, size: 14, dur: 13.5, delay: 8, drift: -10, claro: false },
  { left: 50, size: 9, dur: 10.5, delay: 3.6, drift: 5, claro: true },
  { left: 66, size: 13, dur: 12, delay: 6.5, drift: -4, claro: false },
  { left: 82, size: 11, dur: 11.5, delay: 4.2, drift: 7, claro: true },
];

// Orbes de luz que suben desde abajo.
const orbes = [
  { left: 12, size: 10, dur: 16, delay: 0 },
  { left: 28, size: 6, dur: 13, delay: 4 },
  { left: 40, size: 14, dur: 20, delay: 7 },
  { left: 55, size: 8, dur: 15, delay: 2 },
  { left: 68, size: 5, dur: 12, delay: 6 },
  { left: 80, size: 12, dur: 18, delay: 3 },
  { left: 90, size: 7, dur: 14, delay: 9 },
  { left: 48, size: 9, dur: 17, delay: 11 },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="escena-auth">
      {/* Auroras de fondo */}
      <div className="aurora aurora-1" aria-hidden />
      <div className="aurora aurora-2" aria-hidden />
      <div className="aurora aurora-3" aria-hidden />

      {/* Orbes de luz ascendentes */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {orbes.map((o, i) => (
          <span
            key={`orbe-${i}`}
            className="orbe"
            style={{
              left: `${o.left}%`,
              width: `${o.size}px`,
              height: `${o.size}px`,
              animationDuration: `${o.dur}s`,
              animationDelay: `${o.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Pétalos cayendo */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {petalos.map((p, i) => (
          <span
            key={`petalo-${i}`}
            className={`petalo${p.claro ? " petalo-claro" : ""}`}
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
                "--drift": `${p.drift}vw`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Tarjeta central con el formulario */}
      <main className="surgir relative w-full max-w-[27rem]">
        <span aria-hidden className="halo-auth" />
        <div className="tarjeta-auth">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="flotar">
              <Logo href="/" height={92} priority />
            </div>
          </div>

          {children}

          <div className="mt-7 flex items-center justify-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-tinta-soft">
            <span>AliExpress</span>
            <span className="text-coral">·</span>
            <span>Shein</span>
            <span className="text-coral">·</span>
            <span>Alibaba</span>
          </div>
        </div>
      </main>
    </div>
  );
}
