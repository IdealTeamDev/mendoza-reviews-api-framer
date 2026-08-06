import { put, list } from "@vercel/blob";

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
    addRandomSuffix: false,
  });

  return payload;
}

export async function readReviews() {
  // Sin token de Blob no hay cache que leer; se consultara Google directamente.
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    // Busca el archivo cacheado y descarga su JSON publico.
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
    if (!blobs || blobs.length === 0) return null;
    
    const response = await fetch(blobs[0].url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    // Si Blob falla, se ignora el cache para no romper el sitio.
    return { debugError: error.message || "Unknown error in readReviews" };
  }
}
