import Image from "next/image";
import Link from "next/link";

// Logo oficial de K's Shop. El archivo trae fondo blanco, así que lo
// presentamos como una tarjetita blanca con esquinas redondeadas y una sombra
// rosada suave: se ve bien sobre cualquier fondo y evita el cuadrado blanco
// "duro". `plate` solo cambia la sombra (más fuerte para fondos oscuros).
export default function Logo({
  height = 44,
  href = "/",
  plate = false,
  priority = false,
  className = "",
}: {
  height?: number;
  href?: string | null;
  plate?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const img = (
    <Image
      src="/logo.png"
      alt="K's Shop"
      width={1062}
      height={1005}
      priority={priority}
      sizes={`${height * 2}px`}
      className="select-none"
      style={{ height, width: "auto" }}
    />
  );

  const contenido = (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-black/5 ${
        plate
          ? "shadow-[0_8px_24px_-8px_rgba(74,3,48,0.55)]"
          : "shadow-[0_10px_28px_-10px_rgba(236,11,134,0.45)]"
      }`}
      style={{ lineHeight: 0 }}
    >
      {img}
    </span>
  );

  if (href === null) {
    return <span className={`inline-flex ${className}`}>{contenido}</span>;
  }

  return (
    <Link
      href={href}
      className={`inline-flex transition hover:opacity-90 ${className}`}
      aria-label="K's Shop — inicio"
    >
      {contenido}
    </Link>
  );
}
