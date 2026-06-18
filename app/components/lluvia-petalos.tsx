// Pétalos cayendo: la misma animación del login, pero con un tono fucsia más
// saturado para que resalten sobre el fondo claro de la portada.
// Posiciones, tamaños y ritmos fijos (deterministas) para no romper la
// hidratación de React.
const petalos = [
  { left: 6, size: 12, dur: 11, delay: 0, drift: 9 },
  { left: 14, size: 16, dur: 14, delay: 3, drift: 6 },
  { left: 22, size: 10, dur: 9, delay: 1.5, drift: 12 },
  { left: 30, size: 18, dur: 16, delay: 5, drift: 4 },
  { left: 38, size: 13, dur: 12, delay: 2, drift: 10 },
  { left: 46, size: 11, dur: 10, delay: 6, drift: 7 },
  { left: 54, size: 17, dur: 15, delay: 1, drift: -5 },
  { left: 62, size: 12, dur: 13, delay: 4, drift: 8 },
  { left: 70, size: 15, dur: 11, delay: 7, drift: -8 },
  { left: 78, size: 10, dur: 9.5, delay: 2.5, drift: 6 },
  { left: 86, size: 16, dur: 14.5, delay: 5.5, drift: -6 },
  { left: 92, size: 12, dur: 12.5, delay: 0.8, drift: 9 },
  { left: 18, size: 14, dur: 13.5, delay: 8, drift: -10 },
  { left: 50, size: 9, dur: 10.5, delay: 3.6, drift: 5 },
  { left: 66, size: 13, dur: 12, delay: 6.5, drift: -4 },
  { left: 82, size: 11, dur: 11.5, delay: 4.2, drift: 7 },
];

export default function LluviaPetalos() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {petalos.map((p, i) => (
        <span
          key={i}
          className="petalo petalo-fucsia"
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
  );
}
