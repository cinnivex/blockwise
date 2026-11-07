/**
 * Only allow redirects to paths on this site (e.g. "/timeline"), never to
 * another domain ("//evil.com" or "https://..."), so a crafted login link
 * can't bounce users somewhere else.
 */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
