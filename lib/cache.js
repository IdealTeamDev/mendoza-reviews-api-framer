import { put, head } from "@vercel/blob";

// Nombre unico del archivo JSON donde se guardan las resenas cacheadas.
const BLOB_KEY = "mendoza-google-reviews.json";

export async function saveReviews(payload) {
  // Si no se activo Vercel Blob, la API funciona igual pero sin cache persistente.
  if (!process.env.BLOB_READ_WRITE_TOKEN) return payload;

  // Guarda la ultima sincronizacion para que /api/reviews responda mas rapido.
  await put(BLOB_KEY, JSON.stringify(payload, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });

  return payload;
}

export async function readReviews() {
  // Sin token de Blob no hay cache que leer; se consultara Google directamente.
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    // Busca el archivo cacheado y descarga su JSON publico.
    const metadata = await head(BLOB_KEY);
    const response = await fetch(metadata.url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    // Si Blob falla, se ignora el cache para no romper el sitio.
    return null;
  }
}
