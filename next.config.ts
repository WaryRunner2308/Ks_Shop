import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de los teléfonos pueden pesar más que el límite por defecto
      // (1 MB) de las Server Actions. Lo subimos a 4 MB (por debajo del tope de
      // Vercel, 4.5 MB). Además, las imágenes se comprimen en el navegador antes
      // de enviarse (ver lib/comprimir-imagen.ts), así que rara vez se acercan.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
