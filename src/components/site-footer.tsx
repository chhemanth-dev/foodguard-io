import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

import { PaletteCycler } from "@/components/palette-cycler";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-gradient text-primary-foreground">
            <Leaf className="size-4" aria-hidden="true" />
          </span>
          Food Storage Spoilage Box — fresher food, less waste.
        </p>
        <PaletteCycler className="flex w-fit" />
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
          <Link to="/" className="transition-colors hover:text-primary">Monitor</Link>
          <Link to="/waste-guide" className="transition-colors hover:text-primary">Waste guide</Link>
          <Link to="/innovations" className="transition-colors hover:text-primary">Innovations</Link>
          <Link to="/device-setup" className="transition-colors hover:text-primary">Connect detector</Link>
        </nav>
      </div>
    </footer>
  );
}
