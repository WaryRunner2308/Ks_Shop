import Image from "next/image";
import Link from "next/link";

// Logo oficial de K's Shop. El archivo tiene fondo blanco, así que sobre
// fondos claros usamos `mix-blend-multiply` para fundir ese blanco con las
// nubes. Sobre fondos oscuros usamos `plate` (placa blanca) para que el
// trazo negro del logo siga siendo legible.
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
      className={plate ? "select-none" : "select-none mix-blend-multiply"}
      style={{ height, width: "auto" }}
    />
  );

  const contenido = plate ? (
    <span
      className="inline-flex items-center justify-center rounded-2xl bg-white/95 px-3 py-2 shadow-[0_8px_24px_-8px_rgba(74,3,48,0.5)]"
      style={{ lineHeight: 0 }}
    >
      {img}
    </span>
  ) : (
    img
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
