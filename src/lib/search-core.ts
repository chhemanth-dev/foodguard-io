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

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();

// Free, key-less fallback used when paid search is unavailable (e.g. credits ran out).
export async function freeSearch(data: z.infer<typeof searchInput>): Promise<WebResult[]> {
  const q = encodeURIComponent(data.query);
  const headers = { "User-Agent": "FoodStorageSpoilageBox/1.0 (https://foodguard-io.lovable.app)" };
  const terms = data.query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  const wiki = async (): Promise<WebResult[]> => {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&srlimit=6&format=json&origin=*`, { headers });
    const j = (await r.json()) as { query?: { search?: Array<{ title: string; snippet: string; timestamp?: string }> } };
    return (j.query?.search ?? []).map((s) => ({ title: s.title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}`, snippet: strip(s.snippet).slice(0, 280), date: s.timestamp?.slice(0, 10) ?? null, source: "en.wikipedia.org" }));
  };
  const hn = async (): Promise<WebResult[]> => {
    const r = await fetch(`https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=10`, { headers });
    const j = (await r.json()) as { hits?: Array<{ title?: string; url?: string; story_text?: string; created_at?: string }> };
    return (j.hits ?? []).filter((h) => h.title && h.url).map((h) => ({ title: h.title!, url: h.url!, snippet: strip(h.story_text ?? "").slice(0, 280), date: h.created_at?.slice(0, 10) ?? null, source: hostOf(h.url!) }));
  };
  const reddit = async (): Promise<WebResult[]> => {
    const r = await fetch(`https://www.reddit.com/search.json?q=${q}&limit=10&sort=relevance`, { headers });
    const j = (await r.json()) as { data?: { children?: Array<{ data: { title: string; permalink: string; selftext?: string; created_utc?: number } }> } };
    return (j.data?.children ?? []).map(({ data: p }) => ({ title: p.title, url: `https://www.reddit.com${p.permalink}`, snippet: (p.selftext ?? "").slice(0, 280), date: p.created_utc ? new Date(p.created_utc * 1000).toISOString().slice(0, 10) : null, source: "reddit.com" }));
  };

  const plan = data.source === "social" ? [reddit, hn] : data.source === "news" ? [hn, wiki] : [wiki, hn, reddit];
  const settled = await Promise.allSettled(plan.map((f) => f()));
  const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  const score = (r: WebResult) => { const t = `${r.title} ${r.snippet}`.toLowerCase(); return terms.filter((w) => t.includes(w)).length; };
  const seen = new Set<string>();
  return all
    .map((r) => ({ r, s: score(r) }))
    .filter(({ r, s }) => s >= Math.max(1, Math.ceil(terms.length / 2)) && !seen.has(r.url) && seen.add(r.url))
    .sort((a, b) => b.s - a.s)
    .slice(0, 9)
    .map(({ r }) => r);
}

export async function runSearch(data: z.infer<typeof searchInput>, allowForward = true): Promise<WebResult[]> {
  // Free sources first so search keeps working without credits; paid search only as a backup.
  const free = await freeSearch(data).catch(() => [] as WebResult[]);
  if (free.length >= 3) return free;
  try {
    const paid = await paidSearch(data, allowForward);
    if (paid.length) return paid;
  } catch (e) {
    console.error("Paid search unavailable:", e instanceof Error ? e.message : e);
  }
  if (!free.length) throw new Error("No closely related results found. Try different words.");
  return free;
}

async function paidSearch(data: z.infer<typeof searchInput>, allowForward: boolean): Promise<WebResult[]> {
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

// Credit-free summary built from the results themselves.
export function quickSummary(data: z.infer<typeof summaryInput>): AiSummary {
  const sentences = data.results.flatMap((r) => r.snippet.split(/(?<=[.!?])\s+/)).map((x) => x.trim()).filter((x) => x.length > 40 && x.length < 220);
  const overview = sentences.slice(0, 2).join(" ") || `Here are the most relevant sources found for "${data.query}".`;
  const tips = data.results.slice(0, 4).map((r) => `Read "${r.title.slice(0, 80)}" on ${r.source}.`);
  return { overview, tips };
}

export async function runSummary(data: z.infer<typeof summaryInput>, allowForward = true): Promise<AiSummary> {
  try {
    const ai = await aiSummary(data, allowForward);
    if (ai.overview) return ai;
  } catch (e) {
    console.error("AI summary unavailable, using quick summary:", e instanceof Error ? e.message : e);
  }
  return quickSummary(data);
}

async function aiSummary(data: z.infer<typeof summaryInput>, allowForward: boolean): Promise<AiSummary> {
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
