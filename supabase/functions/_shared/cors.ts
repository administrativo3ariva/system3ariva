// Shared CORS helper with origin allowlist.
// IMPORTANT: keeps the system embeddable in the 3A Riva Connect portal
// (iframe) while preventing arbitrary third-party origins from calling
// our edge functions from the browser.

const STATIC_ALLOWED = new Set<string>([
  "https://www.3arivaconnect.com.br",
  "https://3arivaconnect.com.br",
  "https://system3ariva.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
]);

// Lovable preview / staging hostnames are dynamic, so we match by suffix.
const ALLOWED_SUFFIXES = [
  ".lovable.app",
  ".lovable.dev",
  ".lovableproject.com",
  ".sandbox.lovable.dev",
];

const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return ALLOWED_SUFFIXES.some((s) => host === s.slice(1) || host.endsWith(s));
  } catch {
    return false;
  }
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allow = isAllowedOrigin(origin)
    ? (origin as string)
    : "https://www.3arivaconnect.com.br";
  return {
    ...BASE_HEADERS,
    "Access-Control-Allow-Origin": allow,
  };
}
