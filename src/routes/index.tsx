import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  BellRing,
  Bluetooth,
  Cable,
  Camera,
  Check,
  ChevronRight,
  CircuitBoard,
  Clock3,
  CloudCog,
  Cpu,
  Database,
  Droplets,
  Gauge,
  Mail,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Thermometer,
  TriangleAlert,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLatestDetectorReading, type LiveDetectorReading } from "@/lib/detector.functions";
import { getSensorStatus, getSimulatedReading, type SensorStatus } from "@/lib/sensor-simulator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Food Monitor — Food Storage Spoilage Box" },
      { name: "description", content: "View live sample temperature, humidity, pressure and VOC readings with early food spoilage alerts." },
      { property: "og:title", content: "Live Food Monitor — Food Storage Spoilage Box" },
      { property: "og:description", content: "Monitor storage conditions and receive early food spoilage warnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const statusContent: Record<SensorStatus, { label: string; description: string; className: string; dot: string }> = {
  fresh: {
    label: "Fresh",
    description: "All readings are within the expected safe range.",
    className: "border-safe/30 bg-safe-soft text-safe",
    dot: "bg-safe",
  },
  warning: {
    label: "Early warning",
    description: "VOC levels are rising. Check the food soon.",
    className: "border-warning/40 bg-warning-soft text-warning-foreground",
    dot: "bg-warning",
  },
  risk: {
    label: "Spoilage risk",
    description: "Unsafe changes detected. Inspect food before use.",
    className: "border-destructive/30 bg-danger-soft text-destructive",
    dot: "bg-destructive",
  },
};

const hardware = [
  { name: "ESP32-S3", role: "Main processor and TinyML", icon: Cpu },
  { name: "BME680 / SGP30", role: "Gas, VOC and air sensing", icon: Wind },
  { name: "DS18B20 / SHT31 / SHT40", role: "Temperature and humidity", icon: Thermometer },
  { name: "Camera module", role: "Visual food monitoring", icon: Camera },
  { name: "OLED display", role: "Local readings and status", icon: Smartphone },
  { name: "LED indicators", role: "Green, yellow and red status", icon: Zap },
  { name: "Buzzer", role: "Local audio warning", icon: BellRing },
  { name: "MicroSD card", role: "Sensor logs and image storage", icon: Database },
  { name: "DS3231 RTC", role: "Accurate reading timestamps", icon: Clock3 },
  { name: "Wi-Fi / Bluetooth", role: "Optional data connection", icon: Bluetooth },
];

const hardwareTones: [string, ...string[]] = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function clampPercent(value: number, min: number, max: number) {
  return Math.min(100, Math.max(4, ((value - min) / (max - min)) * 100));
}

function Dashboard() {
  const [step, setStep] = useState(0);
  const [alertActive, setAlertActive] = useState(false);
  const [email, setEmail] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [liveReading, setLiveReading] = useState<LiveDetectorReading | null>(null);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const fetchLatestReading = useServerFn(getLatestDetectorReading);
  const sampleReading = useMemo(() => getSimulatedReading(step, alertActive), [step, alertActive]);
  const reading = useMemo(() => {
    if (alertActive || !liveReading) return sampleReading;
    return {
      temperature: liveReading.temperature,
      humidity: liveReading.humidity,
      pressure: liveReading.pressure,
      voc: liveReading.voc,
      status: getSensorStatus(liveReading),
      updatedAt: new Date(liveReading.receivedAt),
    };
  }, [alertActive, liveReading, sampleReading]);
  const isLive = Boolean(liveReading) && !alertActive;
  const isStale = liveReading && currentTime > 0 ? currentTime - new Date(liveReading.receivedAt).getTime() > 60_000 : false;
  const status = statusContent[reading.status];

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
    } else {
      setNotificationPermission(Notification.permission);
    }
    setCurrentTime(Date.now());

    let active = true;
    const refresh = async () => {
      try {
        const latest = await fetchLatestReading();
        if (active) setLiveReading(latest);
      } catch {
        if (active) setLiveReading(null);
      } finally {
        if (active) setConnectionChecked(true);
      }
    };
    void refresh();
    const sampleTimer = window.setInterval(() => setStep((value) => value + 1), 4000);
    const liveTimer = window.setInterval(() => void refresh(), 15000);
    const clockTimer = window.setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => {
      active = false;
      window.clearInterval(sampleTimer);
      window.clearInterval(liveTimer);
      window.clearInterval(clockTimer);
    };
  }, [fetchLatestReading]);

  async function enableBrowserAlerts() {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") toast.success("Browser alerts enabled.");
    if (permission === "denied") toast.error("Notifications are blocked in browser settings.");
  }

  function triggerAlert() {
    setAlertActive(true);
    toast.error("Sample spoilage risk detected", { description: "VOC and temperature readings have crossed the warning range." });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Food spoilage warning", { body: "The sample storage box has detected a high spoilage risk." });
    }
  }

  function saveEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setEmailEnabled(true);
    toast.success("Email alerts configured", { description: "Demo mode is active until an email service is connected." });
  }

  return (
    <main>
      <section className="relative overflow-hidden">

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="rise-in">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={isLive ? "border-safe/30 bg-safe-soft text-safe" : "border-primary/20 bg-clinical text-primary"}>
                {isLive ? "Live detector data" : connectionChecked ? "Sample data" : "Checking detector"}
              </Badge>
              <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className={`sensor-pulse size-2 rounded-full ${isLive && !isStale ? "bg-safe" : "bg-warning"}`} />
                {isLive ? (isStale ? "Detector signal is delayed" : "Detector connected") : "Waiting for the physical detector"}
              </span>
            </div>
            <h1 className="display-xl max-w-3xl text-foreground">
              Know when food <span className="text-gradient">starts to turn.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              A clear view of temperature, humidity, pressure and gas readings from your Food Storage Spoilage Box.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-brand-gradient shadow-[0_12px_30px_-12px_var(--glow-primary)] transition-transform hover:-translate-y-0.5">
                <a href="#readings-title">View live readings <ChevronRight /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-card/70">
                <Link to="/device-setup"><Cable /> Connect detector</Link>
              </Button>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
              <MiniStat label="Temp" value={`${reading.temperature.toFixed(1)}°C`} />
              <MiniStat label="Humidity" value={`${reading.humidity}%`} />
              <MiniStat label="VOC" value={`${reading.voc} ppb`} />
            </dl>
          </div>

          <div className="rise-in relative" style={{ animationDelay: "120ms" }}>
            <div className="blob absolute -left-6 top-6 size-48 rounded-full bg-primary/30" aria-hidden="true" />
            <div className="blob absolute -right-4 bottom-10 size-56 rounded-full bg-accent/35" style={{ animationDelay: "-6s" }} aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-2 shadow-[0_30px_60px_-35px_var(--glow-primary)]">
              <img
                src="/images/hero-spoilage-box.png"
                alt="Smart food storage box with fresh produce and a sensor module on the lid"
                width={1408}
                height={768}
                className="aspect-[4/3] w-full rounded-[1.6rem] object-cover"
              />
            </div>
            <div className="float-y relative -mt-16 ml-auto mr-2 max-w-xs rounded-2xl bg-popover shadow-2xl sm:mr-6"><div className={`rounded-2xl border p-4 ${status.className}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase">Current food status</p>
                  <p className="mt-1 font-display text-2xl font-bold">{status.label}</p>
                </div>
                <span className={`mt-1 size-4 rounded-full ring-4 ring-background ${status.dot} sensor-pulse`} />
              </div>
              <p className="mt-2 text-sm leading-6">{status.description}</p>
              {alertActive && (
                <Button variant="outline" size="sm" className="mt-3 border-current bg-background/70" onClick={() => setAlertActive(false)}>
                  <Check /> Dismiss sample alert
                </Button>
              )}
            </div></div>
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden border-y border-border bg-foreground py-4 text-background" aria-hidden="true">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-2xl font-bold uppercase tracking-tight sm:text-4xl">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-12">
              <span>Temp {reading.temperature.toFixed(1)}°C</span><span className="text-accent">✦</span>
              <span>Humidity {reading.humidity}%</span><span className="text-accent">✦</span>
              <span>Pressure {reading.pressure} hPa</span><span className="text-accent">✦</span>
              <span>VOC {reading.voc} ppb</span><span className="text-accent">✦</span>
              <span>{status.label}</span><span className="text-accent">✦</span>
              <span>Fresher food · Less waste</span><span className="text-accent">✦</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="readings-title" className="scroll-mt-24">
          <SectionHeading eyebrow="Storage box 01" id="readings-title" title="Sensor readings">
            <p className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              <RefreshCw className="size-3.5" /> {isLive ? `Received from ${liveReading?.deviceId ?? "detector"}` : "Safe sample mode"}
            </p>
          </SectionHeading>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SensorCard tone="var(--chart-2)" icon={Thermometer} label="Temperature" value={`${reading.temperature.toFixed(1)}°C`} range="Expected: 0–5°C" alert={reading.temperature > 5} percent={clampPercent(reading.temperature, 0, 10)} />
            <SensorCard tone="var(--chart-3)" icon={Droplets} label="Humidity" value={`${reading.humidity}%`} range="Expected: 45–70%" alert={reading.humidity > 70} percent={clampPercent(reading.humidity, 0, 100)} />
            <SensorCard tone="var(--chart-4)" icon={Gauge} label="Pressure" value={`${reading.pressure} hPa`} range="Ambient pressure" alert={false} percent={clampPercent(reading.pressure, 980, 1040)} />
            <SensorCard tone="var(--chart-1)" icon={Wind} label="Gas / VOC" value={`${reading.voc} ppb`} range="Warning above 120 ppb" alert={reading.voc > 120} percent={clampPercent(reading.voc, 0, 300)} />
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="hud-glass relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7" aria-labelledby="alerts-title">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <IconTile tone="var(--chart-1)"><Bell className="size-5" /></IconTile>
              <div>
                <h2 id="alerts-title" className="text-xl font-bold">Alert settings</h2>
                <p className="text-sm text-muted-foreground">Choose how urgent warnings reach you.</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-muted/60 p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <BellRing className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-semibold">Browser notifications</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notificationPermission === "granted" ? "Enabled on this device" : notificationPermission === "denied" ? "Blocked in browser settings" : notificationPermission === "unsupported" ? "Not supported on this device" : "Permission not requested"}
                    </p>
                  </div>
                </div>
                <Button className="rounded-full" variant={notificationPermission === "granted" ? "secondary" : "default"} onClick={enableBrowserAlerts} disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}>
                  {notificationPermission === "granted" ? <Check /> : <Bell />} {notificationPermission === "granted" ? "Enabled" : "Enable"}
                </Button>
              </div>
            </div>

            <form className="mt-4 rounded-2xl border border-border bg-muted/60 p-4" onSubmit={saveEmail}>
              <label htmlFor="alert-email" className="flex items-center gap-2 font-semibold"><Mail className="size-5 text-primary" /> Email alerts</label>
              <p className="mt-1 text-sm text-muted-foreground">Save an address for spoilage warnings. Sending is shown in demo mode.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input id="alert-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-10 bg-card" />
                <Button type="submit" className="h-10 rounded-full">{emailEnabled ? <Check /> : <Mail />} {emailEnabled ? "Saved" : "Save email"}</Button>
              </div>
            </form>

            <Button variant="outline" className="mt-5 h-11 w-full rounded-full border-warning/60 bg-warning-soft text-warning-foreground hover:bg-warning/30" onClick={triggerAlert} disabled={alertActive}>
              <TriangleAlert /> {alertActive ? "Sample warning active" : "Test spoilage warning"}
            </Button>
          </section>

          <section className="hud-glass relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7" aria-labelledby="system-title">
            <div className="absolute inset-x-0 top-0 h-1 bg-safe" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <IconTile tone="var(--safe)"><ShieldCheck className="size-5" /></IconTile>
              <div>
                <h2 id="system-title" className="text-xl font-bold">System health</h2>
                <p className="text-sm text-muted-foreground">Physical detector connection status.</p>
              </div>
            </div>
            <dl className="mt-6 flex flex-col gap-2">
              <HealthRow icon={Radio} label="Sensor link" value={isLive ? (isStale ? "Signal delayed" : "Connected") : "Waiting"} ok={isLive && !isStale} />
              <HealthRow icon={CloudCog} label="Data source" value={isLive ? "Physical detector" : "Simulator fallback"} ok={isLive} />
              <HealthRow icon={CircuitBoard} label="Processor" value="ESP32-S3 ready" ok />
              <HealthRow icon={Clock3} label="Last sync" value={isLive ? "Latest reading received" : "No device reading yet"} ok={isLive} />
            </dl>
          </section>
        </div>

        <section className="mt-14" aria-labelledby="hardware-title">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">From the project presentation</p>
              <h2 id="hardware-title" className="mt-1 text-3xl font-bold">Detector components</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Only the physical components specified for the Food Storage Spoilage Box are listed here.</p>
              <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card p-2">
                <img src="/images/esp32-detector.png" alt="ESP32-S3 board wired to gas, temperature, display, LED and buzzer modules" width={1024} height={1024} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {hardware.map(({ name, role, icon: Icon }, index) => (
                <div key={name} className="lift group flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <IconTile tone={hardwareTones[index % hardwareTones.length] ?? hardwareTones[0]}>
                    <Icon className="size-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </IconTile>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold">{name}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mt-14 overflow-hidden rounded-[2rem] bg-brand-gradient p-6 text-primary-foreground sm:p-10">
          <div className="blob absolute -right-10 -top-10 size-64 rounded-full bg-white/25" aria-hidden="true" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="font-display text-3xl font-bold">Use more than the monitor.</p>
              <p className="mt-2 max-w-md text-base opacity-90">Learn simple sorting habits and explore practical waste innovations.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-white text-foreground hover:bg-white/90">
                  <Link to="/waste-guide">Open waste guide <ChevronRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/60 bg-transparent text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  <Link to="/innovations">Explore innovations</Link>
                </Button>
              </div>
            </div>
            <img src="/images/sorting-habits.png" alt="Green bin for food scraps and blue bin for recyclables" width={1024} height={1024} loading="lazy" className="float-y mx-auto aspect-[4/3] w-full max-w-sm rounded-3xl object-cover shadow-2xl" />
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, id, title, children }: { eyebrow: string; id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-3xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function IconTile({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--tone)/15 text-(--tone) ring-1 ring-(--tone)/25"
      style={{ "--tone": tone } as CSSProperties}
    >
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-3 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-bold text-foreground">{value}</dd>
    </div>
  );
}

function SensorCard({ icon: Icon, label, value, range, alert, tone, percent }: { icon: typeof Thermometer; label: string; value: string; range: string; alert: boolean; tone: string; percent: number }) {
  const activeTone = alert ? "var(--destructive)" : tone;
  return (
    <article
      className={`lift group relative overflow-hidden rounded-3xl border bg-card p-5 ${alert ? "border-destructive/40" : "border-border"}`}
      style={{ "--tone": activeTone } as CSSProperties}
    >
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-(--tone)/15 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
      <div className="relative flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-2xl bg-(--tone) text-white shadow-[0_10px_20px_-10px_var(--tone)]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {alert && <TriangleAlert className="size-4 text-destructive" aria-label="Out of range" />}
      </div>
      <p className="relative mt-5 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="relative mt-1 font-mono text-3xl font-bold text-foreground">{value}</p>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-(--tone) transition-[width] duration-700" style={{ width: `${percent}%` }} />
      </div>
      <p className="relative mt-2 text-xs text-muted-foreground">{range}</p>
    </article>
  );
}

function HealthRow({ icon: Icon, label, value, ok }: { icon: typeof Radio; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3">
      <dt className="flex items-center gap-3 text-sm text-muted-foreground"><Icon className="size-4 text-primary" />{label}</dt>
      <dd className="flex items-center gap-2 text-right text-sm font-semibold">
        <span className={`size-2 rounded-full ${ok ? "bg-safe" : "bg-warning"}`} aria-hidden="true" />
        {value}
      </dd>
    </div>
  );
}
