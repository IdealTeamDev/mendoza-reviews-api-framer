import { readReviews, saveReviews } from "../lib/cache.js";
import { fetchGoogleReviews } from "../lib/google.js";
import { json, options } from "../lib/http.js";

// Endpoint publico que consume Framer para pintar las resenas en el sitio.
export default async function handler(req, res) {
  // Permite que Framer consulte la API desde otro dominio.
  if (req.method === "OPTIONS") return options(res);

  // Este endpoint solo expone lectura; la sincronizacion vive en /api/sync.
  if (req.method !== "GET") return json(res, { error: "Metodo no permitido" }, 405);

  try {
    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
    };

    // Si existe cache en Vercel Blob, se responde rapido sin llamar a Google.
    const cached = await readReviews();
    if (cached && !cached.debugError) {
      return json(res, cached, 200, cacheHeaders);
    }
    const debugError = cached ? cached.debugError : "No cached data";
    // Si no hay cache configurado o Blob falló, se consultan las ultimas resenas directamente.
    const fresh = await fetchGoogleReviews();
    await saveReviews(fresh);
    fresh.debugInfo = { debugError, blobTokenExists: !!process.env.BLOB_READ_WRITE_TOKEN };
    return json(res, fresh, 200, cacheHeaders);
  } catch (error) {
    return json(res, { error: error.message || "No se pudieron obtener las resenas" }, 500);
  }
}
