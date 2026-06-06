// ============================================================
// Minimal shared-access-code auth. One code → a signed, httpOnly
// session cookie verified in middleware. Uses Web Crypto (HMAC-
// SHA256) so the same code runs in Edge middleware and Node routes.
//
// Security is intentionally light (see reference/ARCHITECTURE.md §4):
// the goal is to keep bots/randoms out, not to resist a determined
// attacker. Rotate BARN_ACCESS_CODE occasionally.
// ============================================================

export const SESSION_COOKIE = "barn_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (seconds)

const enc = new TextEncoder();

function authSecret(): string {
  // Fall back to the access code so dev works with a single env var.
  return process.env.AUTH_SECRET || process.env.BARN_ACCESS_CODE || "dev-insecure-secret";
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string compare (equal length assumed for sigs). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeToken(): Promise<string> {
  const payload = `v1.${Date.now()}`;
  const sig = await hmacHex(payload, authSecret());
  return `${payload}.${sig}`;
}

export async function verifyToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [v, ts, sig] = parts;
  const expect = await hmacHex(`${v}.${ts}`, authSecret());
  if (!safeEqual(sig, expect)) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age >= 0 && age < SESSION_MAX_AGE * 1000;
}

/** Compare a submitted access code against the configured one. */
export function checkAccessCode(code: string | undefined | null): boolean {
  const expected = process.env.BARN_ACCESS_CODE;
  if (!expected || !code) return false;
  return safeEqual(code, expected);
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearedCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
}
