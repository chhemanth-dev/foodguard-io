// Sign-in handoff for copies of the site hosted outside Lovable (e.g. Vercel).
// Managed Google sign-in only runs on Lovable hosting, so those copies send the
// visitor to the Lovable site, which signs them in and returns them with a session.
export const HANDOFF_HOST = "https://foodguard-io.lovable.app";

// Only these exact origins may receive a session. Add new deployments here.
export const HANDOFF_ALLOWED_ORIGINS = ["https://io-taupe.vercel.app"];

export function isLovableHost(hostname: string) {
  return /(^|\.)(lovable\.app|lovableproject\.com|lovable\.dev)$/.test(hostname) || hostname === "localhost";
}
