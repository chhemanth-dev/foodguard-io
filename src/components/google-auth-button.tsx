import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export function GoogleAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed. Please try again.");
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
  }

  if (user) {
    const avatar = user.user_metadata?.["avatar_url"] as string | undefined;
    const name = (user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? "Account";
    return (
      <div className="flex items-center gap-2">
        {avatar ? <img src={avatar} alt={name} title={name} referrerPolicy="no-referrer" className="size-8 rounded-full border border-border" /> : null}
        <Button variant="ghost" size="sm" className="rounded-full" onClick={signOut} aria-label="Sign out"><LogOut /><span className="hidden lg:inline">Sign out</span></Button>
      </div>
    );
  }

  return (
    <Button size="sm" className="rounded-full" onClick={signIn} disabled={busy}>
      <LogIn /><span className="hidden sm:inline">Sign in with Google</span>
    </Button>
  );
}
