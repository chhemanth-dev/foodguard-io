import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AiSummary = { overview: string; tips: string[] };

export const summarizeResults = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        query: z.string().trim().min(2).max(200),
        results: z.array(z.object({ title: z.string().max(400), snippet: z.string().max(400), source: z.string().max(200) })).min(1).max(9),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<AiSummary> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI summary is not configured.");

    const sources = data.results.map((r, i) => `[${i + 1}] ${r.title} (${r.source}): ${r.snippet}`).join("\n");
    const prompt = `Topic: ${data.query}\n\nSearch results:\n${sources}\n\nUsing only these results, write for a home user managing food and waste:\nLine 1: a 2-3 sentence plain-language overview.\nThen exactly 4 lines, each starting with "- ", giving practical, actionable takeaways (max 25 words each).\nNo headings, no markdown other than the dashes.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
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
  });
