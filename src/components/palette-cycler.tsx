import { Palette as PaletteIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { getPalette, msUntilNextPalette } from "@/lib/palettes";

export function PaletteCycler({ className = "hidden xl:flex" }: { className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: number;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      document.documentElement.setAttribute("data-palette", getPalette(current).id);
      // Wake exactly at the next 50-second boundary so the swap happens on time.
      timer = window.setTimeout(tick, msUntilNextPalette(current) + 50);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  if (now === null) return null;
  const palette = getPalette(now);

  return (
    <div
      className={`items-center gap-2 rounded-full border border-border bg-card/80 py-1 pl-1.5 pr-3 text-xs ${className}`}
      title="Colors switch between blue and pink every 50 seconds."
    >
      <span className="flex -space-x-1.5" aria-hidden="true">
        <span className="size-4 rounded-full border-2 border-card bg-primary" />
        <span className="size-4 rounded-full border-2 border-card bg-accent" />
        <span className="size-4 rounded-full border-2 border-card bg-chart-3" />
      </span>
      <PaletteIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="font-semibold text-foreground">{palette.name}</span>
      <span className="sr-only">color palette. Colors switch every 50 seconds.</span>
    </div>
  );
}
