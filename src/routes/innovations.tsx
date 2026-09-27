import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Biohazard, Factory, Lightbulb, PackageCheck, ScanLine, Sprout, Truck } from "lucide-react";
import type { CSSProperties } from "react";

import { WebDiscovery } from "@/components/web-discovery";
import { PageIntro } from "@/components/page-intro";

export const Route = createFileRoute("/innovations")({
  head: () => ({ meta: [
    { title: "Waste Management Innovations — Food Storage Spoilage Box" },
    { name: "description", content: "Explore practical technologies improving wet and dry waste management." },
    { property: "og:title", content: "Waste Management Innovations" },
    { property: "og:description", content: "A clear overview of practical technologies improving waste sorting, recovery and treatment." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Innovations,
});

const innovations = [
  { category: "Wet waste", title: "Small-scale biodigesters", description: "Anaerobic systems can turn food scraps into biogas and nutrient-rich digestate for local use.", icon: Biohazard, maturity: "In use", tone: "var(--safe)" },
  { category: "Wet waste", title: "In-vessel composting", description: "Enclosed systems control airflow, moisture and heat to process organic waste faster with less odor.", icon: Sprout, maturity: "In use", tone: "var(--chart-3)" },
  { category: "Dry waste", title: "AI-assisted material sorting", description: "Camera and sensor systems identify items on sorting lines and help separate valuable recyclable materials.", icon: ScanLine, maturity: "Scaling", tone: "var(--chart-1)" },
  { category: "Dry waste", title: "Digital product passports", description: "Scannable product records can show material composition, repair guidance and the correct recovery pathway.", icon: PackageCheck, maturity: "Emerging", tone: "var(--chart-4)" },
  { category: "Collection", title: "Fill-level route planning", description: "Connected bin sensors help collection teams prioritize full containers and avoid unnecessary trips.", icon: Truck, maturity: "In use", tone: "var(--chart-2)" },
  { category: "Recovery", title: "Advanced recycling lines", description: "Better washing, optical sorting and material tracking improve the quality of recovered plastic, glass and metals.", icon: Factory, maturity: "Improving", tone: "var(--chart-5)" },
];

function Innovations() {
  return (
    <main>
      <PageIntro eyebrow="Useful technology" title="Better ways to recover value from waste." description="A practical overview of technologies changing how organic scraps, packaging and mixed materials are collected, sorted and treated." icon={Lightbulb} image="/images/innovations.png" imageAlt="Illustration of a biodigester, AI sorting line and connected smart bin" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {innovations.map(({ category, title, description, icon: Icon, maturity, tone }, index) => (
            <article
              key={title}
              className="lift rise-in group relative flex min-h-72 flex-col overflow-hidden rounded-3xl border border-border bg-card p-6"
              style={{ "--tone": tone, animationDelay: `${index * 70}ms` } as CSSProperties}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-(--tone)" aria-hidden="true" />
              <div className="absolute -bottom-16 -right-16 size-44 rounded-full bg-(--tone)/10 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
              <div className="relative flex items-center justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-(--tone) text-white shadow-[0_10px_24px_-12px_var(--tone)] transition-transform duration-300 group-hover:-rotate-6">
                  <Icon className="size-6" />
                </span>
                <span className="rounded-full border border-(--tone)/30 bg-(--tone)/10 px-2.5 py-1 text-xs font-bold text-foreground">{maturity}</span>
              </div>
              <p className="relative mt-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</p>
              <h2 className="relative mt-2 text-xl font-bold">{title}</h2>
              <p className="relative mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="relative mt-auto flex items-center gap-2 pt-6 text-xs font-semibold text-foreground">
                Practical overview <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </article>
          ))}
        </div>
        <section className="relative mt-10 overflow-hidden rounded-3xl bg-brand-gradient p-6 text-primary-foreground sm:p-8">
          <div className="blob absolute -right-10 -top-16 size-56 rounded-full bg-white/20" aria-hidden="true" />
          <h2 className="relative font-display text-2xl font-bold">Start with good separation</h2>
          <p className="relative mt-2 max-w-3xl text-sm leading-6 opacity-90">Technology works best when wet waste, clean recyclables and hazardous material are kept apart at the source. Correct household sorting remains the most useful first step.</p>
        </section>
        <WebDiscovery title="Latest waste innovations online" description="Discover new inventions, startups and projects in waste management from websites, news and social media." defaultQuery="latest waste management innovations 2026" suggestions={["food waste startups", "biogas innovation", "AI waste sorting", "plastic upcycling inventions"]} />
      </div>
    </main>
  );
}
