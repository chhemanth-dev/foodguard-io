import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  BellRing,
  Bluetooth,
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
import { useEffect, useMemo, useState } from "react";
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
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-14">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={isLive ? "border-safe/30 bg-safe-soft text-safe" : "border-primary/20 bg-clinical text-primary"}>
                {isLive ? "Live detector data" : connectionChecked ? "Sample data" : "Checking detector"}
              </Badge>
              <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className={`sensor-pulse size-2 rounded-full ${isLive && !isStale ? "bg-safe" : "bg-warning"}`} />
                {isLive ? (isStale ? "Detector signal is delayed" : "Detector connected") : "Waiting for the physical detector"}
              </span>
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold text-foreground sm:text-5xl">
              Know when food conditions begin to change.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A clear view of temperature, humidity, pressure and gas readings from your Food Storage Spoilage Box.
            </p>
          </div>

          <div className={`border p-5 ${status.className}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase">Current food status</p>
                <p className="mt-2 font-display text-2xl font-bold">{status.label}</p>
              </div>
              <span className={`mt-1 size-4 rounded-full ring-4 ring-background ${status.dot}`} />
            </div>
            <p className="mt-4 text-sm leading-6">{status.description}</p>
            {alertActive && (
              <Button variant="outline" className="mt-4 border-current bg-background/70" onClick={() => setAlertActive(false)}>
                <Check /> Dismiss sample alert
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="readings-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-primary">Storage box 01</p>
              <h2 id="readings-title" className="mt-1 text-2xl font-bold">Sensor readings</h2>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
               <RefreshCw className="size-3.5" /> {isLive ? `Received from ${liveReading?.deviceId ?? "detector"}` : "Safe sample mode"}
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <SensorCard icon={Thermometer} label="Temperature" value={`${reading.temperature.toFixed(1)}°C`} range="Expected: 0–5°C" alert={reading.temperature > 5} />
            <SensorCard icon={Droplets} label="Humidity" value={`${reading.humidity}%`} range="Expected: 45–70%" alert={reading.humidity > 70} />
            <SensorCard icon={Gauge} label="Pressure" value={`${reading.pressure} hPa`} range="Ambient pressure" alert={false} />
            <SensorCard icon={Wind} label="Gas / VOC" value={`${reading.voc} ppb`} range="Warning above 120 ppb" alert={reading.voc > 120} />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="border border-border bg-card p-5 sm:p-6" aria-labelledby="alerts-title">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-clinical text-primary"><Bell className="size-5" /></span>
              <div>
                <h2 id="alerts-title" className="text-xl font-bold">Alert settings</h2>
                <p className="text-sm text-muted-foreground">Choose how urgent warnings reach you.</p>
              </div>
            </div>

            <div className="mt-6 border-y border-border py-5">
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
                <Button variant={notificationPermission === "granted" ? "secondary" : "default"} onClick={enableBrowserAlerts} disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}>
                  {notificationPermission === "granted" ? <Check /> : <Bell />} {notificationPermission === "granted" ? "Enabled" : "Enable"}
                </Button>
              </div>
            </div>

            <form className="mt-5" onSubmit={saveEmail}>
              <label htmlFor="alert-email" className="flex items-center gap-2 font-semibold"><Mail className="size-5 text-primary" /> Email alerts</label>
              <p className="mt-1 text-sm text-muted-foreground">Save an address for spoilage warnings. Sending is shown in demo mode.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input id="alert-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-10" />
                <Button type="submit" className="h-10">{emailEnabled ? <Check /> : <Mail />} {emailEnabled ? "Saved" : "Save email"}</Button>
              </div>
            </form>

            <Button variant="outline" className="mt-5 w-full border-warning/50 text-warning-foreground" onClick={triggerAlert} disabled={alertActive}>
              <TriangleAlert /> {alertActive ? "Sample warning active" : "Test spoilage warning"}
            </Button>
          </section>

          <section className="border border-border bg-card p-5 sm:p-6" aria-labelledby="system-title">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-safe-soft text-safe"><ShieldCheck className="size-5" /></span>
              <div>
                <h2 id="system-title" className="text-xl font-bold">System health</h2>
                <p className="text-sm text-muted-foreground">Physical detector connection status.</p>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              <HealthRow icon={Radio} label="Sensor link" value={isLive ? (isStale ? "Signal delayed" : "Connected") : "Waiting"} />
              <HealthRow icon={CloudCog} label="Data source" value={isLive ? "Physical detector" : "Simulator fallback"} />
              <HealthRow icon={CircuitBoard} label="Processor" value="ESP32-S3 ready" />
              <HealthRow icon={Clock3} label="Last sync" value={isLive ? "Latest reading received" : "No device reading yet"} />
            </dl>
          </section>
        </div>

        <section className="mt-8 border-t border-border pt-8" aria-labelledby="hardware-title">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-primary">From the project presentation</p>
            <h2 id="hardware-title" className="mt-1 text-2xl font-bold">Detector components</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Only the physical components specified for the Food Storage Spoilage Box are listed here.</p>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {hardware.map(({ name, role, icon: Icon }) => (
              <div key={name} className="min-h-36 bg-card p-4">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-5 text-sm font-bold">{name}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-col justify-between gap-5 border border-primary/20 bg-clinical p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold">Use more than the monitor.</p>
            <p className="mt-1 text-sm text-muted-foreground">Learn simple sorting habits and explore practical waste innovations.</p>
          </div>
          <Button asChild>
            <a href="/waste-guide">Open waste guide <ChevronRight /></a>
          </Button>
        </section>
      </div>
    </main>
  );
}

function SensorCard({ icon: Icon, label, value, range, alert }: { icon: typeof Thermometer; label: string; value: string; range: string; alert: boolean }) {
  return (
    <article className={`min-h-44 bg-card p-5 ${alert ? "border-t-4 border-destructive" : "border-t-4 border-transparent"}`}>
      <div className="flex items-center justify-between">
        <Icon className={alert ? "size-5 text-destructive" : "size-5 text-primary"} aria-hidden="true" />
        {alert && <TriangleAlert className="size-4 text-destructive" aria-label="Out of range" />}
      </div>
      <p className="mt-6 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-3 text-xs text-muted-foreground">{range}</p>
    </article>
  );
}

function HealthRow({ icon: Icon, label, value }: { icon: typeof Radio; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <dt className="flex items-center gap-3 text-sm text-muted-foreground"><Icon className="size-4 text-primary" />{label}</dt>
      <dd className="text-right text-sm font-semibold">{value}</dd>
    </div>
  );
}