import { createHash, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const readingSchema = z.object({
  deviceId: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  temperature: z.number().finite().min(-50).max(100),
  humidity: z.number().finite().min(0).max(100),
  pressure: z.number().finite().min(300).max(1200),
  voc: z.number().finite().min(0).max(1_000_000),
  measuredAt: z.string().datetime({ offset: true }).optional(),
});

function matchesSecret(received: string | null, expected: string) {
  if (!received) return false;
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export const Route = createFileRoute("/api/public/detector/readings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedSecret = process.env["DETECTOR_API_KEY"];
        if (!expectedSecret) return Response.json({ error: "Detector connection is not configured." }, { status: 503, headers: jsonHeaders });
        if (!matchesSecret(request.headers.get("x-device-key"), expectedSecret)) {
          return Response.json({ error: "Invalid device key." }, { status: 401, headers: jsonHeaders });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers: jsonHeaders });
        }

        const parsed = readingSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Reading is invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 400, headers: jsonHeaders });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("detector_readings").insert({
          device_id: parsed.data.deviceId,
          temperature: parsed.data.temperature,
          humidity: parsed.data.humidity,
          pressure: parsed.data.pressure,
          voc: parsed.data.voc,
          measured_at: parsed.data.measuredAt ?? null,
        });
        if (error) return Response.json({ error: "Reading could not be stored." }, { status: 500, headers: jsonHeaders });
        return Response.json({ ok: true, receivedAt: new Date().toISOString() }, { status: 201, headers: jsonHeaders });
      },
    },
  },
});
