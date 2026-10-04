import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export function EmailAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  function openDialog() {
    setStep("email");
    setCode("");
    setOpen(true);
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 255) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.status === 429 ? "Too many requests. Please wait a minute and try again." : "Couldn't send the code. Please try again.");
      return;
    }
    setEmail(trimmed);
    setStep("code");
    toast.success("Verification code sent. Check your inbox.");
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      toast.error("Enter the code from your email.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setBusy(false);
    if (error) {
      toast.error("That code is incorrect or has expired.");
      return;
    }
    setOpen(false);
    toast.success("Signed in.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
  }

  if (user) {
    const label = user.email ?? "Account";
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-40 truncate text-xs font-medium text-muted-foreground lg:inline" title={label}>{label}</span>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={signOut} aria-label="Sign out"><LogOut /><span className="hidden lg:inline">Sign out</span></Button>
      </div>
    );
  }

  return (
    <>
      <Button size="sm" className="rounded-full" onClick={openDialog}>
        <LogIn /><span className="hidden sm:inline">Sign in</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "email" ? <Mail className="size-5 text-primary" /> : <ShieldCheck className="size-5 text-primary" />}
              {step === "email" ? "Sign in with email" : "Enter your code"}
            </DialogTitle>
            <DialogDescription>
              {step === "email"
                ? "We'll email you a verification code. New here? The same code creates your account."
                : `We sent a code to ${email}. It expires in a few minutes.`}
            </DialogDescription>
          </DialogHeader>

          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-email">Email address</Label>
                <Input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Sending…" : "Send verification code"}</Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-code">Verification code</Label>
                <Input id="auth-code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} className="text-center font-mono text-lg tracking-[0.4em]" autoFocus />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Checking…" : "Verify and sign in"}</Button>
              <div className="flex justify-between text-xs">
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep("email")}>Change email</button>
                <button type="button" className="font-semibold text-primary" disabled={busy} onClick={() => sendCode()}>Resend code</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
