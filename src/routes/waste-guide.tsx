import { createFileRoute } from "@tanstack/react-router";
import { Apple, CheckCircle2, CircleSlash, Leaf, Package, Recycle, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";

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

function WasteGuide() {
  const [tab, setTab] = useState("wet");
  return (
    <main>
      <PageIntro eyebrow="Practical sorting" title="Separate waste before it becomes a problem." description="Use this quick guide to keep compostable material away from clean recyclables and reduce contamination at home." icon={Recycle} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-2 rounded-md bg-muted p-1 sm:w-fit" role="group" aria-label="Waste type">
          <Button variant={tab === "wet" ? "outline" : "ghost"} className="h-10 border-transparent px-5" onClick={() => setTab("wet")} aria-pressed={tab === "wet"}>
            <Leaf /> Wet waste
          </Button>
          <Button variant={tab === "dry" ? "outline" : "ghost"} className="h-10 border-transparent px-5" onClick={() => setTab("dry")} aria-pressed={tab === "dry"}>
            <Package /> Dry waste
          </Button>
        </div>
        <div className="mt-6">
          {tab === "wet" ? (
            <WastePanel title="Wet waste" description="Biodegradable kitchen material that breaks down naturally." items={wetItems} icon={Apple} accent="safe" steps={["Keep a small covered bin near food preparation areas.", "Drain excess liquid before placing scraps in the bin.", "Compost locally where possible, or use your municipal wet-waste collection.", "Wash the container regularly to control odor and pests."]} />
          ) : (
            <WastePanel title="Dry waste" description="Non-biodegradable material that can often be recovered or recycled." items={dryItems} icon={Package} accent="primary" steps={["Empty and rinse containers so food does not contaminate them.", "Let packaging dry before placing it in the recycling bin.", "Keep paper flat and protected from moisture.", "Use local collection rules for glass, metal, plastic and electronic waste."]} />
          )}
        </div>

        <section className="mt-10 border border-warning/40 bg-warning-soft p-5 sm:p-6">
          <div className="flex gap-4">
            <CircleSlash className="mt-0.5 size-6 shrink-0 text-warning-foreground" />
            <div>
              <h2 className="text-lg font-bold text-warning-foreground">Keep hazardous waste separate</h2>
              <p className="mt-2 text-sm leading-6 text-warning-foreground">Batteries, bulbs, medicines, paint, sanitary waste and electronic items need dedicated collection. Do not mix them with kitchen scraps or ordinary recyclables.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function WastePanel({ title, description, items, icon: Icon, accent, steps }: { title: string; description: string; items: string[]; icon: typeof Apple; accent: "safe" | "primary"; steps: string[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="hud-glass rounded-2xl border border-border bg-card p-5 sm:p-7">
        <span className={`grid size-11 place-items-center rounded-md ${accent === "safe" ? "bg-safe-soft text-safe" : "bg-clinical text-primary"}`}><Icon className="size-6" /></span>
        <h2 className="mt-5 text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <ul className="mt-6 space-y-3">
          {items.map((item) => <li key={item} className="flex items-center gap-3 border-t border-border pt-3 text-sm"><CheckCircle2 className={`size-4 shrink-0 ${accent === "safe" ? "text-safe" : "text-primary"}`} />{item}</li>)}
        </ul>
      </section>
      <section className="hud-glass rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3"><Trash2 className="size-5 text-primary" /><h2 className="text-xl font-bold">Handle it well</h2></div>
        <ol className="mt-6 space-y-5">
          {steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{index + 1}</span><p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p></li>)}
        </ol>
      </section>
    </div>
  );
}