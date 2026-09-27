import type { LucideIcon } from "lucide-react";

export function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="orbit pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-dashed border-primary/30" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-4 flex items-center gap-2 w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-bold uppercase text-primary">
          <Icon className="size-4" aria-hidden="true" />
          {eyebrow}
        </div>
        <h1 className="rise-in max-w-3xl text-3xl font-bold text-foreground sm:text-5xl"><span className="text-gradient">{title}</span></h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}