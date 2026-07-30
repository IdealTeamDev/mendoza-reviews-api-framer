import { saveReviews } from "../lib/cache.js";
import { fetchGoogleReviews } from "../lib/google.js";
import { json, options } from "../lib/http.js";

export default async function handler(request) {
  if (request.method === "OPTIONS") return options();

  const url = new URL(request.url);
  const secret = request.headers.get("x-cron-secret") || url.searchParams.get("secret");
  const isVercelCron = request.headers.get("user-agent") === "vercel-cron/1.0";

  if (!isVercelCron && process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await fetchGoogleReviews();
    await saveReviews(payload);
    return json({ ok: true, count: payload.reviews.length, updatedAt: payload.updatedAt });
  } catch (error) {
    return json({ error: error.message || "Unable to sync reviews" }, 500);
  }
}
