import type { LucideIcon } from "lucide-react";

export function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
  image,
  imageAlt = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="rise-in">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-card/80 py-1 pl-1 pr-3 text-xs font-bold uppercase tracking-wider text-primary">
            <span className="grid size-6 place-items-center rounded-full bg-brand-gradient text-primary-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            {eyebrow}
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl">
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        </div>
        {image && (
          <div className="rise-in relative" style={{ animationDelay: "120ms" }}>
            <div className="blob absolute -left-4 top-4 size-40 rounded-full bg-primary/30" aria-hidden="true" />
            <div className="blob absolute -right-2 bottom-2 size-44 rounded-full bg-accent/35" style={{ animationDelay: "-5s" }} aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-2 shadow-[0_30px_60px_-35px_var(--glow-primary)]">
              <img src={image} alt={imageAlt} width={1024} height={1024} className="aspect-[4/3] w-full rounded-[1.6rem] object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
