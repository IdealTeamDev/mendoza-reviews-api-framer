import { readReviews, saveReviews } from "../lib/cache.js";
import { fetchGoogleReviews } from "../lib/google.js";
import { json, options } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return options(res);
  if (req.method !== "GET") return json(res, { error: "Method not allowed" }, 405);

  try {
    const cached = await readReviews();
    if (cached) return json(res, cached);

    const fresh = await fetchGoogleReviews();
    await saveReviews(fresh);
    return json(res, fresh);
  } catch (error) {
    return json(res, { error: error.message || "Unable to fetch reviews" }, 500);
  }
}
