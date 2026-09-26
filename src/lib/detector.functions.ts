import { createServerFn } from "@tanstack/react-start";

export type LiveDetectorReading = {
  deviceId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  voc: number;
  measuredAt: string | null;
  receivedAt: string;
};

export const getLatestDetectorReading = createServerFn({ method: "GET" }).handler(async (): Promise<LiveDetectorReading | null> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("detector_readings")
    .select("device_id, temperature, humidity, pressure, voc, measured_at, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Unable to load the latest detector reading.");
  if (!data) return null;

  return {
    deviceId: data.device_id,
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure,
    voc: data.voc,
    measuredAt: data.measured_at,
    receivedAt: data.created_at,
  };
});
