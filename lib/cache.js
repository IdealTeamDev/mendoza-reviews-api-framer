import { put, head } from "@vercel/blob";

const BLOB_KEY = "mendoza-google-reviews.json";

export async function saveReviews(payload) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return payload;

  await put(BLOB_KEY, JSON.stringify(payload, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });

  return payload;
}

export async function readReviews() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    const metadata = await head(BLOB_KEY);
    const response = await fetch(metadata.url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
