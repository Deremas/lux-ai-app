import { parsePhoneNumberFromString } from "libphonenumber-js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NAME_REGEX = /^[A-Za-z][A-Za-z .,'-]{1,119}$/;
const COMPANY_REGEX = /^[A-Za-z0-9 .,'&()\/-]{2,120}$/;
const ROLE_REGEX = /^[A-Za-z0-9 .,'&()\/-]{2,120}$/;
const TIMEZONE_REGEX = /^[A-Za-z_\/+-]{2,64}$/;
const TEXT_REGEX = /^[A-Za-z0-9 \n\r.,;:!?'\"()\/\-@&+#%_*\[\]{}]+$/;
const TOKEN_REGEX = /^[a-f0-9]{64}$/i;

export function isBodyTooLarge(req: Request, maxBytes: number): boolean {
  const len = req.headers.get("content-length");
  if (!len) return false;
  const num = Number(len);
  if (!Number.isFinite(num)) return false;
  return num > maxBytes;
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_REGEX.test(value);
}

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidName(value: string): boolean {
  return NAME_REGEX.test(value);
}

export function isValidCompany(value: string): boolean {
  return COMPANY_REGEX.test(value);
}

export function isValidRole(value: string): boolean {
  return ROLE_REGEX.test(value);
}

export function isValidPhone(value: string): boolean {
  if (!value) return false;
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) return false;
  const digits = parsed.nationalNumber ?? "";
  const len = digits.length;
  if (len < 8 || len > 15) return false;
  return parsed.isValid() && parsed.isPossible();
}

export function isValidTimezone(value: string): boolean {
  return TIMEZONE_REGEX.test(value);
}

export function isValidNotes(value: string, min = 8, max = 1000): boolean {
  if (value.length < min || value.length > max) return false;
  return TEXT_REGEX.test(value);
}

export function isValidMessage(value: string, min = 1, max = 2000): boolean {
  if (value.length < min || value.length > max) return false;
  return TEXT_REGEX.test(value);
}

export function isValidResetToken(value: string): boolean {
  return TOKEN_REGEX.test(value);
}
