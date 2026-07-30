import { saveReviews } from "../lib/cache.js";
import { fetchGoogleReviews } from "../lib/google.js";
import { json, options } from "../lib/http.js";

// Endpoint de sincronizacion: actualiza las resenas desde Google Business Profile.
export default async function handler(req, res) {
  // Responde preflight CORS cuando el navegador lo solicita.
  if (req.method === "OPTIONS") return options(res);

  // Vercel Node entrega req.url como ruta relativa, por eso se agrega una base.
  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);

  // Permite ejecutar el endpoint manualmente con ?secret=... o por header.
  const secret = req.headers["x-cron-secret"] || url.searchParams.get("secret");

  // El cron nativo de Vercel usa este user-agent al ejecutar la tarea programada.
  const isVercelCron = req.headers["user-agent"] === "vercel-cron/1.0";

  // Protege la sincronizacion manual para que no cualquiera dispare el proceso.
  if (!isVercelCron && process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return json(res, { error: "No autorizado" }, 401);
  }

  try {
    // Trae las ultimas resenas, las guarda en cache si Blob esta activo y responde.
    const payload = await fetchGoogleReviews();
    await saveReviews(payload);
    return json(res, { ok: true, count: payload.reviews.length, updatedAt: payload.updatedAt });
  } catch (error) {
    return json(res, { error: error.message || "No se pudieron sincronizar las resenas" }, 500);
  }
}
