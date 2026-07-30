export function json(res, response, status = 200) {
  const headers = corsHeaders({ "Content-Type": "application/json; charset=utf-8" });
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.statusCode = status;
  res.end(JSON.stringify(response, null, 2));
}

export function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-cron-secret, Authorization",
    ...extra,
  };
}

export function options(res) {
  const headers = corsHeaders();
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.statusCode = 204;
  res.end();
}
