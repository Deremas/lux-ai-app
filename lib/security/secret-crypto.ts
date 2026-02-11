import "server-only";
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getKey() {
  const raw = process.env.APP_SECRET_KEY;
  if (!raw) {
    throw new Error("Missing APP_SECRET_KEY");
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString(
    "base64"
  )}`;
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 3) return null;
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export function hasSecret(payload: string | null | undefined): boolean {
  return Boolean(payload && payload.trim().length > 0);
}
