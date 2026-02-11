import { NextRequest, NextResponse } from "next/server";

type RateLimitRule = {
  prefix: string;
  max: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const RULES: RateLimitRule[] = [
  { prefix: "/api/contact", max: 5, windowMs: 60_000 },
  { prefix: "/api/lead", max: 5, windowMs: 60_000 },
  { prefix: "/api/upload", max: 10, windowMs: 60_000 },
  { prefix: "/api/chat", max: 30, windowMs: 60_000 },
  { prefix: "/api/auth", max: 30, windowMs: 60_000 },
  { prefix: "/api/scheduling", max: 60, windowMs: 60_000 },
];

const DEFAULT_RULE: RateLimitRule = { prefix: "/api", max: 120, windowMs: 60_000 };

const buckets = new Map<string, Bucket>();
let sweepCounter = 0;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return req.ip ?? "unknown";
}

function getRuleForPath(pathname: string): RateLimitRule {
  return RULES.find((rule) => pathname.startsWith(rule.prefix)) ?? DEFAULT_RULE;
}

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") return NextResponse.next();

  const pathname = req.nextUrl.pathname;
  const rule = getRuleForPath(pathname);
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "unknown";
  const identity = ip === "unknown" ? `ua:${ua}` : ip;
  const key = `${identity}:${rule.prefix}:${req.method}`;

  const now = Date.now();
  if (++sweepCounter % 1000 === 0) {
    for (const [bucketKey, bucketValue] of buckets) {
      if (now >= bucketValue.resetAt) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return NextResponse.next();
  }

  bucket.count += 1;

  const remaining = Math.max(0, rule.max - bucket.count);
  const resetSeconds = Math.ceil(bucket.resetAt / 1000);

  if (bucket.count > rule.max) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(rule.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetSeconds),
          "X-RateLimit-Policy": `${rule.max};w=${Math.ceil(rule.windowMs / 1000)}`,
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(rule.max));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(resetSeconds));
  res.headers.set(
    "X-RateLimit-Policy",
    `${rule.max};w=${Math.ceil(rule.windowMs / 1000)}`
  );
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
