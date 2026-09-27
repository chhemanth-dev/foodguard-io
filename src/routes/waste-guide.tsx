import { createFileRoute } from "@tanstack/react-router";
import { Apple, CheckCircle2, CircleSlash, Leaf, Package, Recycle, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { WebDiscovery } from "@/components/web-discovery";

export const Route = createFileRoute("/waste-guide")({
  head: () => ({ meta: [
    { title: "Wet & Dry Waste Guide — Food Storage Spoilage Box" },
    { name: "description", content: "Sort wet and dry household waste correctly with clear, practical guidance." },
    { property: "og:title", content: "Wet & Dry Waste Guide" },
    { property: "og:description", content: "Simple household guidance for sorting and managing wet and dry waste." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: WasteGuide,
});

const wetItems = ["Fruit and vegetable peels", "Leftover cooked food", "Tea leaves and coffee grounds", "Eggshells", "Spoiled produce"];
const dryItems = ["Clean paper and cardboard", "Rinsed plastic containers", "Glass bottles and jars", "Metal cans", "Clean packaging"];

const tabs = [
  { id: "wet", label: "Wet waste", icon: Leaf },
  { id: "dry", label: "Dry waste", icon: Package },
] as const;

function WasteGuide() {
  const [tab, setTab] = useState<"wet" | "dry">("wet");
  return (
    <main>
      <PageIntro eyebrow="Practical sorting" title="Separate waste before it becomes a problem." description="Use this quick guide to keep compostable material away from clean recyclables and reduce contamination at home." icon={Recycle} image="/images/sorting-habits.png" imageAlt="Green bin for food scraps next to a blue bin for recyclables" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-2 gap-1 rounded-full border border-border bg-card/80 p-1 sm:w-fit" role="group" aria-label="Waste type">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-300 ${
                tab === id
                  ? id === "wet"
                    ? "bg-safe text-safe-foreground shadow-[0_8px_20px_-10px_var(--safe)]"
                    : "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_var(--glow-primary)]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
        <div key={tab} className="rise-in mt-6">
          {tab === "wet" ? (
            <WastePanel title="Wet waste" description="Biodegradable kitchen material that breaks down naturally." items={wetItems} icon={Apple} accent="safe" image="/images/wet-waste.png" imageAlt="Compost bin filled with peels, eggshells and coffee grounds" steps={["Keep a small covered bin near food preparation areas.", "Drain excess liquid before placing scraps in the bin.", "Compost locally where possible, or use your municipal wet-waste collection.", "Wash the container regularly to control odor and pests."]} />
          ) : (
            <WastePanel title="Dry waste" description="Non-biodegradable material that can often be recovered or recycled." items={dryItems} icon={Package} accent="primary" image="/images/dry-waste.png" imageAlt="Recycling bin with cardboard, rinsed plastic, a glass jar and a metal can" steps={["Empty and rinse containers so food does not contaminate them.", "Let packaging dry before placing it in the recycling bin.", "Keep paper flat and protected from moisture.", "Use local collection rules for glass, metal, plastic and electronic waste."]} />
          )}
        </div>

        <section className="mt-10 flex gap-4 rounded-3xl border border-warning/50 bg-warning-soft p-5 sm:p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning text-foreground">
            <CircleSlash className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-warning-foreground">Keep hazardous waste separate</h2>
            <p className="mt-2 text-sm leading-6 text-warning-foreground">Batteries, bulbs, medicines, paint, sanitary waste and electronic items need dedicated collection. Do not mix them with kitchen scraps or ordinary recyclables.</p>
          </div>
        </section>
        <WebDiscovery title="More waste ideas from around the web" description="Fresh tips, videos and posts about managing wet and dry waste, pulled from websites, news and social media." defaultQuery="home wet and dry waste management tips" suggestions={["composting at home", "kitchen waste reuse", "plastic recycling at home", "e-waste disposal"]} />
      </div>
    </main>
  );
}

function WastePanel({ title, description, items, icon: Icon, accent, steps, image, imageAlt }: { title: string; description: string; items: string[]; icon: typeof Apple; accent: "safe" | "primary"; steps: string[]; image: string; imageAlt: string }) {
  const isSafe = accent === "safe";
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hud-glass overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
          <div className={`p-3 ${isSafe ? "bg-safe-soft" : "bg-clinical"}`}>
            <img src={image} alt={imageAlt} width={1024} height={1024} loading="lazy" className="h-full min-h-56 w-full rounded-2xl object-cover" />
          </div>
          <div className="p-5 sm:p-7">
            <span className={`grid size-11 place-items-center rounded-2xl text-white ${isSafe ? "bg-safe" : "bg-primary"}`}><Icon className="size-6" /></span>
            <h2 className="mt-4 text-2xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {items.map((item) => (
                <li key={item} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-transform hover:-translate-y-0.5 ${isSafe ? "border-safe/30 bg-safe-soft" : "border-primary/25 bg-clinical"}`}>
                  <CheckCircle2 className={`size-4 shrink-0 ${isSafe ? "text-safe" : "text-primary"}`} />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="hud-glass rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent-foreground"><Trash2 className="size-5" /></span>
          <h2 className="text-xl font-bold">Handle it well</h2>
        </div>
        <ol className="relative mt-6 flex flex-col gap-5 before:absolute before:bottom-3 before:left-4 before:top-3 before:w-px before:bg-border">
          {steps.map((step, index) => (
            <li key={step} className="relative flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-primary-foreground ring-4 ring-card">{index + 1}</span>
              <p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
