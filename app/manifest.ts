import type { MetadataRoute } from "next";

// Manifest de la PWA. Next.js lo sirve en /manifest.webmanifest y enlaza la
// etiqueta <link rel="manifest"> automáticamente. Colores tomados de la paleta
// fucsia de la marca (ver globals.css).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "K's Shop",
    short_name: "K's Shop",
    description:
      "Tus compras de AliExpress, Shein y Alibaba, sin complicaciones.",
    start_url: "/",
    display: "standalone",
    theme_color: "#ec0b86",
    background_color: "#ffe3f3",
    lang: "es",
    icons: [
      {
        src: "/icons/icono-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icono-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icono-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
