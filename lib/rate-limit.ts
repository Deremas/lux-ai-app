import { createClient } from "redis";

type RateLimitRule = {
  id: string;
  max: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
};

const RATE_LIMIT_RULES = {
  contact: { id: "contact", max: 5, windowMs: 60_000 },
  lead: { id: "lead", max: 5, windowMs: 60_000 },
  upload: { id: "upload", max: 10, windowMs: 60_000 },
  chat: { id: "chat", max: 30, windowMs: 60_000 },
  auth: { id: "auth", max: 11, windowMs: 60_000 },
  scheduling: { id: "scheduling", max: 60, windowMs: 60_000 },
};

const LUA_RATE_LIMIT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {current, ttl}
`;

type RedisClient = ReturnType<typeof createClient>;

type RedisGlobal = {
  __redisClient?: RedisClient;
  __redisClientPromise?: Promise<RedisClient>;
};

function getGlobal(): RedisGlobal {
  return globalThis as unknown as RedisGlobal;
}

async function getRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  const globalRef = getGlobal();
  if (globalRef.__redisClient) return globalRef.__redisClient;
  if (globalRef.__redisClientPromise) return globalRef.__redisClientPromise;

  const client = createClient({ url });
  globalRef.__redisClientPromise = client.connect().then(() => client);
  const connected = await globalRef.__redisClientPromise;
  globalRef.__redisClient = connected;
  return connected;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function buildHeaders(
  rule: RateLimitRule,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rule.max),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    "X-RateLimit-Policy": `${rule.max};w=${Math.ceil(rule.windowMs / 1000)}`,
  };
}

export async function applyRateLimit(
  req: Request,
  rule: RateLimitRule,
  options?: { identity?: string; methodGroup?: string }
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    return {
      ok: true,
      limit: rule.max,
      remaining: rule.max,
      resetAt: Date.now() + rule.windowMs,
      headers: {},
    };
  }

  const ip = getClientIp(req);
  const identity = options?.identity?.trim();
  const methodGroup = options?.methodGroup?.trim() || req.method;
  const keyId = identity ? `${ip}:${identity}` : ip;
  const key = `ratelimit:${rule.id}:${methodGroup}:${keyId}`;

  try {
    const [countRaw, ttlRaw] = (await client.eval(LUA_RATE_LIMIT, {
      keys: [key],
      arguments: [String(rule.windowMs)],
    })) as [number, number];

    const count = Number(countRaw) || 0;
    const ttl = Math.max(0, Number(ttlRaw) || 0);
    const remaining = Math.max(0, rule.max - count);
    const resetAt = Date.now() + ttl;
    const headers = buildHeaders(rule, remaining, resetAt);

    if (count > rule.max) {
      headers["Retry-After"] = String(Math.ceil(ttl / 1000));
      return { ok: false, limit: rule.max, remaining: 0, resetAt, headers };
    }

    return { ok: true, limit: rule.max, remaining, resetAt, headers };
  } catch (error) {
    console.error("Rate limit error:", error);
    return {
      ok: true,
      limit: rule.max,
      remaining: rule.max,
      resetAt: Date.now() + rule.windowMs,
      headers: {},
    };
  }
}

export { RATE_LIMIT_RULES };
