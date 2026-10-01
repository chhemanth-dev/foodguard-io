import { createFileRoute } from "@tanstack/react-router";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export const Route = createFileRoute("/api/public/summary")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { runSummary, summaryInput } = await import("@/lib/search-core");
        const parsed = summaryInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400, headers: cors });
        try {
          return Response.json(await runSummary(parsed.data, false), { headers: cors });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "AI summary failed." }, { status: 502, headers: cors });
        }
      },
    },
  },
});
