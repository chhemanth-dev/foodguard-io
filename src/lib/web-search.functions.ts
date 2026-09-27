import { createServerFn } from "@tanstack/react-start";
import { gateway, generateText } from "ai";
import { z } from "zod";

export const SOURCE_FILTERS = {
  web: [] as string[],
  social: ["youtube.com", "reddit.com", "instagram.com", "linkedin.com", "x.com", "facebook.com", "tiktok.com", "medium.com"],
  news: ["bbc.com", "reuters.com", "theguardian.com", "thehindu.com", "downtoearth.org.in", "wired.com", "techcrunch.com", "weforum.org"],
} as const;

export type SourceFilter = keyof typeof SOURCE_FILTERS;

export type WebResult = { title: string; url: string; snippet: string; date: string | null; source: string };

type PerplexityOutput =
  | { results: Array<{ title: string; url: string; snippet: string; date?: string; lastUpdated?: string }>; id: string }
  | { error: string; statusCode?: number; message: string };

export const searchWeb = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().trim().min(2).max(200), source: z.enum(["web", "social", "news"]) }).parse(data),
  )
  .handler(async ({ data }): Promise<WebResult[]> => {
    const domains = SOURCE_FILTERS[data.source];

    let output: PerplexityOutput | undefined;
    try {
      const result = await generateText({
        model: "openai/gpt-5.4-nano",
        prompt: `Search the web for: ${data.query}`,
        tools: {
          perplexity_search: gateway.tools.perplexitySearch({
            maxResults: 9,
            maxTokensPerPage: 256,
            ...(domains.length ? { searchDomainFilter: [...domains] } : {}),
          }),
        },
        toolChoice: { type: "tool", toolName: "perplexity_search" },
      });
      output = result.toolResults.find((r) => r.toolName === "perplexity_search")?.output as PerplexityOutput | undefined;
    } catch (e) {
      console.error("Web search failed:", e);
      throw new Error("Search failed. Please try again.");
    }

    if (!output) return [];
    if ("error" in output) {
      console.error(`Web search failed [${output.error}]: ${output.message}`);
      throw new Error(output.error === "rate_limit" ? "Search is busy right now. Try again shortly." : "Search failed. Please try again.");
    }

    return output.results
      .filter((r) => r.url && r.title)
      .map((r) => {
        let source = "";
        try {
          source = new URL(r.url).hostname.replace(/^www\./, "");
        } catch {
          source = "";
        }
        return { title: r.title, url: r.url, snippet: r.snippet.slice(0, 280), date: r.date ?? null, source };
      });
  });
