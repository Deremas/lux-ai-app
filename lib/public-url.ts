function normalizeUrlLike(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

function firstHeaderValue(headers: Headers, name: string) {
  const value = headers.get(name);
  if (!value) return null;
  const first = value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);
  return first || null;
}

function isLocalOrPrivateOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

function originFromRequest(req: Request): string | null {
  const forwardedHost = firstHeaderValue(req.headers, "x-forwarded-host");
  const forwardedProto = firstHeaderValue(req.headers, "x-forwarded-proto");
  const forwardedPort = firstHeaderValue(req.headers, "x-forwarded-port");
  const host = forwardedHost || firstHeaderValue(req.headers, "host");
  const requestOrigin = normalizeUrlLike(req.url);

  if (host) {
    const requestProto = requestOrigin
      ? new URL(requestOrigin).protocol.replace(/:$/, "")
      : null;
    const proto = forwardedProto || requestProto || "https";
    const hostWithPort =
      forwardedPort &&
      !host.includes(":") &&
      forwardedPort !== "80" &&
      forwardedPort !== "443"
        ? `${host}:${forwardedPort}`
        : host;
    const forwardedOrigin = normalizeUrlLike(`${proto}://${hostWithPort}`);
    if (forwardedOrigin) return forwardedOrigin;
  }

  return requestOrigin;
}

function envPublicOrigin() {
  return [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.SITE_URL,
  ]
    .map((value) => normalizeUrlLike(value))
    .find(Boolean);
}

/**
 * Prefer a public request origin over a localhost NEXTAUTH_URL.
 * That mismatch is a common production misconfig that breaks auth redirects.
 */
export function getPublicBaseUrl(req?: Request) {
  const envUrl = envPublicOrigin();
  const requestUrl = req ? originFromRequest(req) : null;

  if (requestUrl && envUrl && isLocalOrPrivateOrigin(envUrl) && !isLocalOrPrivateOrigin(requestUrl)) {
    return requestUrl;
  }

  if (envUrl) return envUrl;
  if (requestUrl) return requestUrl;
  return "https://luxaiautomation.com";
}
