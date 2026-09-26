import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Biohazard, Factory, Lightbulb, PackageCheck, ScanLine, Sprout, Truck } from "lucide-react";

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
  { category: "Wet waste", title: "Small-scale biodigesters", description: "Anaerobic systems can turn food scraps into biogas and nutrient-rich digestate for local use.", icon: Biohazard, maturity: "In use" },
  { category: "Wet waste", title: "In-vessel composting", description: "Enclosed systems control airflow, moisture and heat to process organic waste faster with less odor.", icon: Sprout, maturity: "In use" },
  { category: "Dry waste", title: "AI-assisted material sorting", description: "Camera and sensor systems identify items on sorting lines and help separate valuable recyclable materials.", icon: ScanLine, maturity: "Scaling" },
  { category: "Dry waste", title: "Digital product passports", description: "Scannable product records can show material composition, repair guidance and the correct recovery pathway.", icon: PackageCheck, maturity: "Emerging" },
  { category: "Collection", title: "Fill-level route planning", description: "Connected bin sensors help collection teams prioritize full containers and avoid unnecessary trips.", icon: Truck, maturity: "In use" },
  { category: "Recovery", title: "Advanced recycling lines", description: "Better washing, optical sorting and material tracking improve the quality of recovered plastic, glass and metals.", icon: Factory, maturity: "Improving" },
];

function Innovations() {
  return (
    <main>
      <PageIntro eyebrow="Useful technology" title="Better ways to recover value from waste." description="A practical overview of technologies changing how organic scraps, packaging and mixed materials are collected, sorted and treated." icon={Lightbulb} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {innovations.map(({ category, title, description, icon: Icon, maturity }) => (
            <article key={title} className="flex min-h-72 flex-col bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-10 place-items-center rounded-md bg-clinical text-primary"><Icon className="size-5" /></span>
                <span className="text-xs font-bold text-safe">{maturity}</span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase text-primary">{category}</p>
              <h2 className="mt-2 text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="mt-auto flex items-center gap-2 pt-6 text-xs font-semibold text-muted-foreground">Practical overview <ArrowRight className="size-3.5" /></div>
            </article>
          ))}
        </div>
        <section className="mt-8 border-l-4 border-primary bg-clinical p-6">
          <h2 className="text-lg font-bold">Start with good separation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Technology works best when wet waste, clean recyclables and hazardous material are kept apart at the source. Correct household sorting remains the most useful first step.</p>
        </section>
      </div>
    </main>
  );
}