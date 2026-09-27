import { Link } from "@tanstack/react-router";
import { BellRing, Cable, FlaskConical, Lightbulb, Menu, Recycle, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { to: "/" as const, label: "Monitor", icon: FlaskConical },
  { to: "/waste-guide" as const, label: "Waste guide", icon: Recycle },
  { to: "/innovations" as const, label: "Innovations", icon: Lightbulb },
  { to: "/device-setup" as const, label: "Connect detector", icon: Cable },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary via-safe to-accent text-primary-foreground shadow-[0_0_24px_var(--glow-primary)]">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <span className="truncate font-display text-sm font-bold text-foreground sm:text-base">
            Food Storage Spoilage Box
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_var(--border)]" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
              className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background/90 p-3 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_var(--border)]" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}