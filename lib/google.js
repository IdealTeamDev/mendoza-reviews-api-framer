const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// El sitio solo debe mostrar las ultimas 30 resenas con comentario.
const MAX_REVIEWS = 30;

export async function fetchGoogleReviews() {
  // Google Business Profile requiere un access token temporal generado con OAuth.
  const token = await getGoogleAccessToken();

  // Ejemplo real: accounts/111.../locations/947... para Mendoza Plastic Surgery.
  const locationName = requiredEnv("GBP_LOCATION_NAME");
  const reviews = [];
  let pageToken = "";

  do {
    // API avanzada de Google Business Profile; no es Google Places basico.
    const url = new URL(`https://mybusiness.googleapis.com/v4/${locationName}/reviews`);

    // Ordena por actualizacion reciente y pide bloques de hasta 50.
    url.searchParams.set("orderBy", "updateTime desc");
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Error de Google Business Profile ${response.status}: ${body}`);
    }

    const data = await response.json();
    for (const review of data.reviews || []) {
      // Se omiten calificaciones sin texto porque no sirven para el carrusel.
      const text = cleanText(review.comment || "");
      if (!text) continue;

      // Se normaliza la respuesta de Google a una estructura simple para Framer.
      reviews.push({
        id: review.reviewId,
        authorName: review.reviewer?.displayName || "Paciente",
        authorPhoto: review.reviewer?.profilePhotoUrl || "",
        rating: mapRating(review.starRating),
        text,
        date: review.createTime || review.updateTime || "",
        source: "Google",
      });

      // Evita traer o devolver mas de 50 resenas.
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
  // El refresh token permanente genera access tokens nuevos sin login manual.
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
    throw new Error(`Error de Google OAuth ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.access_token;
}

function mapRating(value) {
  // Google devuelve estrellas como texto; Framer necesita un numero simple.
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[value] || Number(value) || 5;
}

function cleanText(value) {
  // Limpia saltos y espacios para que las tarjetas no tengan texto irregular.
  return String(value).replace(/\s+/g, " ").trim();
}

function requiredEnv(name) {
  // Falla de forma clara si falta una variable en Vercel.
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno: ${name}`);
  return value;
}
