// Genera los íconos de la PWA a partir de public/logo.png usando sharp.
//
// Produce tres PNG en public/icons/:
//   - icono-192.png  (purpose "any")  → logo centrado sobre fondo blanco
//   - icono-512.png  (purpose "any")  → logo centrado sobre fondo blanco
//   - icono-maskable-512.png (purpose "maskable") → logo más pequeño con
//     ~18% de margen alrededor (zona de seguridad) para que Android no le
//     recorte partes al aplicar la máscara circular u otras formas.
//
// Correr con: pnpm iconos
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, "..");
const origen = join(raiz, "public", "logo.png");
const carpetaIconos = join(raiz, "public", "icons");

// Fondo blanco: el logo ya viene con fondo blanco, así mantenemos el trazo
// negro/fucsia legible sobre cualquier máscara.
const BLANCO = { r: 255, g: 255, b: 255, alpha: 1 };

async function generarIcono(lado, margenRelativo, nombre) {
  // Tamaño que ocupará el logo dentro del lienzo cuadrado.
  const ladoLogo = Math.round(lado * (1 - margenRelativo * 2));

  const logoRedimensionado = await sharp(origen)
    .resize(ladoLogo, ladoLogo, {
      fit: "contain",
      background: BLANCO,
    })
    .toBuffer();

  await sharp({
    create: {
      width: lado,
      height: lado,
      channels: 4,
      background: BLANCO,
    },
  })
    .composite([{ input: logoRedimensionado, gravity: "center" }])
    .png()
    .toFile(join(carpetaIconos, nombre));

  console.log(`✓ ${nombre} (${lado}px, margen ${Math.round(margenRelativo * 100)}%)`);
}

async function main() {
  await mkdir(carpetaIconos, { recursive: true });

  // Íconos "any": logo casi a tope, solo un pequeño respiro de 6%.
  await generarIcono(192, 0.06, "icono-192.png");
  await generarIcono(512, 0.06, "icono-512.png");

  // Maskable: zona de seguridad de 18% para sobrevivir la máscara de Android.
  await generarIcono(512, 0.18, "icono-maskable-512.png");

  console.log("\nÍconos PWA generados en public/icons/");
}

main().catch((error) => {
  console.error("Error generando íconos:", error);
  process.exit(1);
});
