import { saveReviews } from "../lib/cache.js";
import { fetchGoogleReviews } from "../lib/google.js";
import { json, options } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return options(res);

  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const secret = req.headers["x-cron-secret"] || url.searchParams.get("secret");
  const isVercelCron = req.headers["user-agent"] === "vercel-cron/1.0";

  if (!isVercelCron && process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return json(res, { error: "Unauthorized" }, 401);
  }

  try {
    const payload = await fetchGoogleReviews();
    await saveReviews(payload);
    return json(res, { ok: true, count: payload.reviews.length, updatedAt: payload.updatedAt });
  } catch (error) {
    return json(res, { error: error.message || "Unable to sync reviews" }, 500);
  }
}
