// Comprime una imagen en el navegador antes de subirla.
//
// Las fotos de los teléfonos pesan varios MB; eso rompe el envío (las Server
// Actions de Next y Vercel limitan el tamaño del cuerpo de la petición). Aquí
// reescalamos la imagen a un lado máximo y la exportamos como JPEG, dejándola
// normalmente en unos cientos de KB sin pérdida visible para una foto de
// referencia o un comprobante.
//
// Si algo falla (formato raro, navegador viejo), devolvemos el archivo original
// para no bloquear al usuario.
export async function comprimirImagen(
  file: File,
  maxLado = 1600,
  calidad = 0.82,
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxLado || height > maxLado) {
      const escala = maxLado / Math.max(width, height);
      width = Math.round(width * escala);
      height = Math.round(height * escala);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", calidad),
    );
    if (!blob || blob.size >= file.size) return file;

    const nombre = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
