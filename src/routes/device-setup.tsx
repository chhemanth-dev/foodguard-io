import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Copy, Cpu, Download, KeyRound, Radio, Router, UploadCloud } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/device-setup")({
  head: () => ({ meta: [
    { title: "Connect Detector — Food Storage Spoilage Box" },
    { name: "description", content: "Connect an ESP32-S3 food spoilage detector to the live monitoring dashboard." },
    { property: "og:title", content: "Connect Detector — Food Storage Spoilage Box" },
    { property: "og:description", content: "ESP32-S3 connection guide for live food storage sensor readings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DeviceSetup,
});

const payload = `{
  "deviceId": "storage-box-01",
  "temperature": 3.4,
  "humidity": 63,
  "pressure": 1012,
  "voc": 82
}`;

function DeviceSetup() {
  const [origin, setOrigin] = useState("");
  const endpoint = origin ? `${origin}/api/public/detector/readings` : "/api/public/detector/readings";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copyEndpoint() {
    await navigator.clipboard.writeText(endpoint);
    toast.success("Endpoint copied.");
  }

  return <main>
    <PageIntro eyebrow="Physical detector" title="Connect your ESP32-S3" description="Send one small reading every 15 seconds. The monitor automatically switches from sample data when the first reading arrives." icon={Radio} image="/images/esp32-detector.png" imageAlt="ESP32-S3 board wired to gas, temperature, display, LED and buzzer modules" />
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <ol className="grid gap-4 md:grid-cols-3">
        <Step tone="var(--chart-1)" icon={KeyRound} number="1" title="Save the device key" text="Create one strong key and save it securely when prompted. Put the same key in the ESP32 code." />
        <Step tone="var(--chart-2)" icon={Router} number="2" title="Add Wi-Fi details" text="Open the downloaded file and replace the Wi-Fi name, password, website address and device key." />
        <Step tone="var(--chart-3)" icon={UploadCloud} number="3" title="Upload and check" text="Upload the sketch to the ESP32-S3. A live status should appear on the monitor after its first message." />
      </ol>

      <section className="hud-glass relative mt-8 overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7" aria-labelledby="endpoint-title">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Connection address</p>
        <h2 id="endpoint-title" className="mt-1 text-2xl font-bold">Detector endpoint</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-2xl border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground">{endpoint}</code>
          <Button className="h-auto rounded-full px-5" onClick={copyEndpoint}><Copy /> Copy</Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Send a POST request with <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">Content-Type: application/json</code> and your key in the <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">x-device-key</code> header.</p>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="hud-glass rounded-3xl border border-border bg-card p-5 sm:p-7" aria-labelledby="format-title">
          <h2 id="format-title" className="text-xl font-bold">Reading format</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-foreground p-4 font-mono text-xs leading-6 text-background"><code>{payload}</code></pre>
          <p className="mt-3 text-sm text-muted-foreground">Temperature is °C, humidity is %, pressure is hPa, and VOC is ppb.</p>
        </section>
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-primary-foreground sm:p-7" aria-labelledby="firmware-title">
          <Cpu className="absolute -bottom-6 -right-6 size-40 opacity-15" aria-hidden="true" />
          <h2 id="firmware-title" className="relative text-xl font-bold">ESP32 Arduino example</h2>
          <p className="relative mt-3 text-sm leading-6 opacity-90">The sketch includes Wi-Fi and dashboard sending. Replace its four setup values and connect the reading variables to your installed sensor libraries.</p>
          <Button asChild className="relative mt-5 rounded-full bg-white text-foreground hover:bg-white/90"><a href="/firmware/food-spoilage-box.ino" download><Download /> Download .ino file</a></Button>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-safe/30 bg-safe-soft p-5 sm:p-6">
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-safe text-safe-foreground"><CheckCircle2 className="size-5" /></span>
          <div><h2 className="font-bold text-safe">Connection check</h2><p className="mt-1 text-sm leading-6 text-foreground/80">Open Serial Monitor at 115200 baud. Response 201 means the reading was accepted. Response 401 means the device key does not match.</p></div>
        </div>
      </section>
    </div>
  </main>;
}

function Step({ icon: Icon, number, title, text, tone }: { icon: typeof Radio; number: string; title: string; text: string; tone: string }) {
  return (
    <li className="lift group relative overflow-hidden rounded-3xl border border-border bg-card p-5" style={{ "--tone": tone } as CSSProperties}>
      <span className="absolute -right-2 -top-4 font-display text-8xl font-bold text-(--tone)/15 transition-transform duration-500 group-hover:scale-110" aria-hidden="true">{number}</span>
      <span className="relative grid size-11 place-items-center rounded-2xl bg-(--tone) text-white"><Icon className="size-5" /></span>
      <p className="relative mt-5 text-xs font-bold tracking-wider text-muted-foreground">STEP {number}</p>
      <h2 className="relative mt-1 font-bold">{title}</h2>
      <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </li>
  );
}
