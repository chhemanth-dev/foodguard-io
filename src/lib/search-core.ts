import { z } from "zod";

// Hosts without the Lovable-managed keys (e.g. Vercel) forward requests here.
export const HOSTED_API_BASE = "https://foodguard-io.lovable.app/api/public";

export const SOURCE_FILTERS = {
  web: [] as string[],
  social: ["youtube.com", "reddit.com", "instagram.com", "linkedin.com", "x.com", "facebook.com", "tiktok.com", "medium.com"],
  news: ["bbc.com", "reuters.com", "theguardian.com", "thehindu.com", "downtoearth.org.in", "wired.com", "techcrunch.com", "weforum.org"],
} as const;

export type SourceFilter = keyof typeof SOURCE_FILTERS;
export type WebResult = { title: string; url: string; snippet: string; date: string | null; source: string };
export type AiSummary = { overview: string; tips: string[] };

export const searchInput = z.object({ query: z.string().trim().min(2).max(200), source: z.enum(["web", "social", "news"]) });
export const summaryInput = z.object({
  query: z.string().trim().min(2).max(200),
  results: z.array(z.object({ title: z.string().max(400), snippet: z.string().max(400), source: z.string().max(200) })).min(1).max(9),
});

function keys() {
  return { lovable: process.env["LOVABLE_API_KEY"], perplexity: process.env["PERPLEXITY_API_KEY"] };
}

async function forward<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${HOSTED_API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(json.error ?? "Search failed. Please try again.");
  return json;
}

export async function runSearch(data: z.infer<typeof searchInput>, allowForward = true): Promise<WebResult[]> {
  const { lovable, perplexity } = keys();
  if (!lovable || !perplexity) {
    if (allowForward) return (await forward<{ results: WebResult[] }>("search", data)).results;
    throw new Error("Search is not configured.");
  }
  const domains = SOURCE_FILTERS[data.source];
  const response = await fetch("https://connector-gateway.lovable.dev/perplexity/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": perplexity, "Content-Type": "application/json" },
    body: JSON.stringify({ query: data.query, max_results: 9, ...(domains.length ? { search_domain_filter: [...domains] } : {}) }),
  });
  if (!response.ok) {
    console.error(`Web search failed [${response.status}]: ${await response.text()}`);
    throw new Error(response.status === 429 ? "Search is busy right now. Try again shortly." : response.status === 402 ? "Search credits have run out." : "Search failed. Please try again.");
  }
  const output = (await response.json()) as { results?: Array<{ title: string; url: string; snippet?: string; date?: string }> };
  return (output.results ?? [])
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
}

export async function runSummary(data: z.infer<typeof summaryInput>, allowForward = true): Promise<AiSummary> {
  const { lovable } = keys();
  if (!lovable) {
    if (allowForward) return forward<AiSummary>("summary", data);
    throw new Error("AI summary is not configured.");
  }
  const sources = data.results.map((r, i) => `[${i + 1}] ${r.title} (${r.source}): ${r.snippet}`).join("\n");
  const prompt = `Topic: ${data.query}\n\nSearch results:\n${sources}\n\nUsing only these results, write for a home user managing food and waste:\nLine 1: a 2-3 sentence plain-language overview.\nThen exactly 4 lines, each starting with "- ", giving practical, actionable takeaways (max 25 words each).\nNo headings, no markdown other than the dashes.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": lovable, Authorization: `Bearer ${lovable}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "user", content: prompt }], stream: true }),
  });
  if (!res.ok || !res.body) {
    console.error(`AI summary failed [${res.status}]: ${await res.text()}`);
    throw new Error(res.status === 429 ? "AI is busy right now. Try again shortly." : res.status === 402 ? "AI credits have run out." : "AI summary failed.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
        const delta = evt.choices?.[0]?.delta?.content;
        if (delta) text += delta;
      } catch {
        /* ignore partial */
      }
    }
  }
  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const tips = rows.filter((l) => l.startsWith("-")).map((l) => l.replace(/^-\s*/, "")).slice(0, 4);
  const overview = rows.filter((l) => !l.startsWith("-")).join(" ");
  return { overview, tips };
}
