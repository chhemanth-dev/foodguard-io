import { Link } from "@tanstack/react-router";
import { BellRing, Cable, FlaskConical, Lightbulb, Menu, Recycle, X } from "lucide-react";
import { useState } from "react";

import { PaletteCycler } from "@/components/palette-cycler";
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-[0_8px_24px_-8px_var(--glow-primary)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <BellRing className="size-5" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-safe sensor-pulse" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-sm font-bold text-foreground sm:text-base">Food Storage Spoilage Box</span>
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">Freshness, sensed early</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 md:flex" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_var(--glow-primary)]" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground" }}
              className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <PaletteCycler />

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
        <nav className="border-t border-border bg-background/95 p-3 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold"
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
