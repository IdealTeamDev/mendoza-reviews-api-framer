export function json(response, status = 200) {
  return new Response(JSON.stringify(response, null, 2), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

export function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-cron-secret, Authorization",
    ...extra,
  };
}

export function options() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
