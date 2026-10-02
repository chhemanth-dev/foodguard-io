import { createFileRoute } from "@tanstack/react-router";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Public read-only endpoint: latest sensor reading (no personal data).
export const Route = createFileRoute("/api/public/detector/latest")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("detector_readings")
          .select("device_id, temperature, humidity, pressure, voc, measured_at, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return Response.json({ error: "Unable to load reading." }, { status: 500, headers });
        if (!data) return Response.json({ reading: null, online: false }, { headers });
        const ageSeconds = Math.round((Date.now() - new Date(data.created_at).getTime()) / 1000);
        return Response.json({
          reading: {
            deviceId: data.device_id,
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            voc: data.voc,
            measuredAt: data.measured_at,
            receivedAt: data.created_at,
          },
          ageSeconds,
          online: ageSeconds <= 60,
        }, { headers });
      },
    },
  },
});
