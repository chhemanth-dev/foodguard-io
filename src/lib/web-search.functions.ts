import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const SOURCE_FILTERS = {
  web: [] as string[],
  social: ["youtube.com", "reddit.com", "instagram.com", "linkedin.com", "x.com", "facebook.com", "tiktok.com", "medium.com"],
  news: ["bbc.com", "reuters.com", "theguardian.com", "thehindu.com", "downtoearth.org.in", "wired.com", "techcrunch.com", "weforum.org"],
} as const;

export type SourceFilter = keyof typeof SOURCE_FILTERS;

export type WebResult = { title: string; url: string; snippet: string; date: string | null; source: string };

export const searchWeb = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().trim().min(2).max(200), source: z.enum(["web", "social", "news"]) }).parse(data),
  )
  .handler(async ({ data }): Promise<WebResult[]> => {
    const domains = SOURCE_FILTERS[data.source];
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    if (!LOVABLE_API_KEY || !PERPLEXITY_API_KEY) throw new Error("Search is not configured.");

    const response = await fetch("https://connector-gateway.lovable.dev/perplexity/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": PERPLEXITY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: data.query,
        max_results: 9,
        ...(domains.length ? { search_domain_filter: [...domains] } : {}),
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Web search failed [${response.status}]: ${body}`);
      throw new Error(response.status === 429 ? "Search is busy right now. Try again shortly." : response.status === 402 ? "Search credits have run out." : "Search failed. Please try again.");
    }
    const output = (await response.json()) as { results?: Array<{ title: string; url: string; snippet?: string; date?: string }> };
    if (!output.results) return [];

    return output.results
      .filter((r) => r.url && r.title)
      .map((r) => {
        let source = "";
        try {
          source = new URL(r.url).hostname.replace(/^www\./, "");
        } catch {
          source = "";
        }
        return { title: r.title, url: r.url, snippet: (r.snippet ?? "").slice(0, 280), date: r.date ?? null, source };
      });
  });
