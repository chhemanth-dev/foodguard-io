import { Palette as PaletteIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { getPalette, msUntilNextPalette } from "@/lib/palettes";

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function PaletteCycler({ className = "hidden xl:flex" }: { className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      document.documentElement.setAttribute("data-palette", getPalette(current).id);
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) return null;
  const palette = getPalette(now);

  return (
    <div
      className={`items-center gap-2 rounded-full border border-border bg-card/80 py-1 pl-1.5 pr-3 text-xs ${className}`}
      title={`Colors refresh every 2 hours. Next palette in ${formatRemaining(msUntilNextPalette(now))}.`}
    >
      <span className="flex -space-x-1.5" aria-hidden="true">
        <span className="size-4 rounded-full border-2 border-card bg-primary" />
        <span className="size-4 rounded-full border-2 border-card bg-accent" />
        <span className="size-4 rounded-full border-2 border-card bg-chart-3" />
      </span>
      <PaletteIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="font-semibold text-foreground">{palette.name}</span>
      <span className="sr-only">
        color palette. Next palette in {formatRemaining(msUntilNextPalette(now))}.
      </span>
    </div>
  );
}
