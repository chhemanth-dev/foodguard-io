import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { HANDOFF_ALLOWED_ORIGINS } from "@/lib/auth-handoff";

export const Route = createFileRoute("/auth/handoff")({
  head: () => ({
    meta: [
      { title: "Signing in — Food Storage Spoilage Box" },
      { name: "description", content: "Completing Google sign-in for Food Storage Spoilage Box." },
      { property: "og:title", content: "Signing in — Food Storage Spoilage Box" },
      { property: "og:description", content: "Completing Google sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthHandoff,
});

const RETURN_KEY = "auth-handoff-return";
const ATTEMPT_KEY = "auth-handoff-attempted";

async function waitForSession(ms: number) {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  return new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>((resolve) => {
    const timer = setTimeout(() => { sub.subscription.unsubscribe(); resolve(null); }, ms);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) { clearTimeout(timer); sub.subscription.unsubscribe(); resolve(session); }
    });
  });
}

function AuthHandoff() {
  const [message, setMessage] = useState("Signing you in with Google…");

  useEffect(() => {
    (async () => {
      const fromQuery = new URLSearchParams(window.location.search).get("return");
      if (fromQuery) sessionStorage.setItem(RETURN_KEY, fromQuery);
      const target = sessionStorage.getItem(RETURN_KEY) ?? "";
      let origin = "";
      try { origin = new URL(target).origin; } catch { /* invalid */ }
      if (!HANDOFF_ALLOWED_ORIGINS.includes(origin)) {
        setMessage("This sign-in link isn't allowed.");
        return;
      }

      const session = await waitForSession(fromQuery ? 300 : 4000);
      if (session) {
        sessionStorage.removeItem(RETURN_KEY);
        sessionStorage.removeItem(ATTEMPT_KEY);
        const params = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: String(session.expires_in ?? 3600),
          expires_at: String(session.expires_at ?? Math.floor(Date.now() / 1000) + 3600),
          token_type: "bearer",
          type: "handoff",
        });
        window.location.replace(`${origin}/#${params.toString()}`);
        return;
      }

      if (!fromQuery && sessionStorage.getItem(ATTEMPT_KEY)) {
        sessionStorage.removeItem(ATTEMPT_KEY);
        setMessage("Google sign-in didn't finish. Please go back and try again.");
        return;
      }
      sessionStorage.setItem(ATTEMPT_KEY, "1");
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth/handoff` });
      if (result.error) { setMessage("Google sign-in failed. Please go back and try again."); return; }
      if (!result.redirected) {
        const s = await waitForSession(4000);
        if (s) window.location.reload();
      }
    })();
  }, []);

  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <p className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{message}</p>
    </main>
  );
}
