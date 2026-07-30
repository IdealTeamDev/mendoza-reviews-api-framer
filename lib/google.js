const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const MAX_REVIEWS = 50;

export async function fetchGoogleReviews() {
  const token = await getGoogleAccessToken();
  const locationName = requiredEnv("GBP_LOCATION_NAME");
  const reviews = [];
  let pageToken = "";

  do {
    const url = new URL(`https://mybusiness.googleapis.com/v4/${locationName}/reviews`);
    url.searchParams.set("orderBy", "updateTime desc");
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Business Profile error ${response.status}: ${body}`);
    }

    const data = await response.json();
    for (const review of data.reviews || []) {
      const text = cleanText(review.comment || "");
      if (!text) continue;

      reviews.push({
        id: review.reviewId,
        authorName: review.reviewer?.displayName || "Paciente",
        authorPhoto: review.reviewer?.profilePhotoUrl || "",
        rating: mapRating(review.starRating),
        text,
        date: review.createTime || review.updateTime || "",
        source: "Google",
      });

      if (reviews.length >= MAX_REVIEWS) break;
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken && reviews.length < MAX_REVIEWS);

  return {
    updatedAt: new Date().toISOString(),
    total: reviews.length,
    reviews: reviews.slice(0, MAX_REVIEWS),
  };
}

async function getGoogleAccessToken() {
  const params = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    refresh_token: requiredEnv("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google OAuth error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.access_token;
}

function mapRating(value) {
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[value] || Number(value) || 5;
}

function cleanText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
