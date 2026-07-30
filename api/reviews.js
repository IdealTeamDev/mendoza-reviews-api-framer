import { readReviews, saveReviews } from "../lib/cache.js";
import { fetchGoogleReviews } from "../lib/google.js";
import { json, options } from "../lib/http.js";

export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  if (request.method === "OPTIONS") return options();
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const cached = await readReviews();
    if (cached) return json(cached);

    const fresh = await fetchGoogleReviews();
    await saveReviews(fresh);
    return json(fresh);
  } catch (error) {
    return json({ error: error.message || "Unable to fetch reviews" }, 500);
  }
}
