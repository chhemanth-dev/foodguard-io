import { createFileRoute } from "@tanstack/react-router";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export const Route = createFileRoute("/api/public/search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { runSearch, searchInput } = await import("@/lib/search-core.server");
        const parsed = searchInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid search." }, { status: 400, headers: cors });
        try {
          return Response.json({ results: await runSearch(parsed.data, false) }, { headers: cors });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Search failed." }, { status: 502, headers: cors });
        }
      },
    },
  },
});
