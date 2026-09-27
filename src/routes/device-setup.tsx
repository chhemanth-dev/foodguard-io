import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Copy, Download, KeyRound, Radio, Router, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
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
    <PageIntro eyebrow="Physical detector" title="Connect your ESP32-S3" description="Send one small reading every 15 seconds. The monitor automatically switches from sample data when the first reading arrives." icon={Radio} />
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        <Step icon={KeyRound} number="1" title="Save the device key" text="Create one strong key and save it securely when prompted. Put the same key in the ESP32 code." />
        <Step icon={Router} number="2" title="Add Wi-Fi details" text="Open the downloaded file and replace the Wi-Fi name, password, website address and device key." />
        <Step icon={UploadCloud} number="3" title="Upload and check" text="Upload the sketch to the ESP32-S3. A live status should appear on the monitor after its first message." />
      </ol>

      <section className="mt-8 border border-border bg-card p-5 sm:p-6" aria-labelledby="endpoint-title">
        <p className="text-xs font-bold uppercase text-primary">Connection address</p>
        <h2 id="endpoint-title" className="mt-1 text-xl font-bold">Detector endpoint</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-muted px-3 py-3 text-sm text-foreground">{endpoint}</code>
          <Button variant="outline" onClick={copyEndpoint}><Copy /> Copy</Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Send a POST request with <code className="text-foreground">Content-Type: application/json</code> and your key in the <code className="text-foreground">x-device-key</code> header.</p>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="hud-glass rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="format-title">
          <h2 id="format-title" className="text-xl font-bold">Reading format</h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6 text-foreground"><code>{payload}</code></pre>
          <p className="mt-3 text-sm text-muted-foreground">Temperature is °C, humidity is %, pressure is hPa, and VOC is ppb.</p>
        </section>
        <section className="hud-glass rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="firmware-title">
          <h2 id="firmware-title" className="text-xl font-bold">ESP32 Arduino example</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The sketch includes Wi-Fi and dashboard sending. Replace its four setup values and connect the reading variables to your installed sensor libraries.</p>
          <Button asChild className="mt-5"><a href="/firmware/food-spoilage-box.ino" download><Download /> Download .ino file</a></Button>
        </section>
      </div>

      <section className="mt-6 border border-safe/30 bg-safe-soft p-5 sm:p-6">
        <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-safe" /><div><h2 className="font-bold text-safe">Connection check</h2><p className="mt-1 text-sm leading-6 text-safe">Open Serial Monitor at 115200 baud. Response 201 means the reading was accepted. Response 401 means the device key does not match.</p></div></div>
      </section>
    </div>
  </main>;
}

function Step({ icon: Icon, number, title, text }: { icon: typeof Radio; number: string; title: string; text: string }) {
  return <li className="bg-card p-5"><div className="flex items-center justify-between"><Icon className="size-5 text-primary" /><span className="text-xs font-bold text-muted-foreground">STEP {number}</span></div><h2 className="mt-5 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></li>;
}
