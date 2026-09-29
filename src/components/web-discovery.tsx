import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ExternalLink, Globe, Loader2, Newspaper, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { summarizeResults, type AiSummary } from "@/lib/ai-summary.functions";
import { searchWeb, type SourceFilter, type WebResult } from "@/lib/web-search.functions";

const sources: { id: SourceFilter; label: string; icon: typeof Globe }[] = [
  { id: "web", label: "Whole web", icon: Globe },
  { id: "social", label: "Social media", icon: Users },
  { id: "news", label: "News", icon: Newspaper },
];

export function WebDiscovery({ title, description, defaultQuery, suggestions }: { title: string; description: string; defaultQuery: string; suggestions: string[] }) {
  const runSearch = useServerFn(searchWeb);
  const runSummary = useServerFn(summarizeResults);
  const [query, setQuery] = useState(defaultQuery);
  const [source, setSource] = useState<SourceFilter>("web");
  const [results, setResults] = useState<WebResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  async function summarize(q: string, found: WebResult[]) {
    setSummary(null);
    setSummaryError(null);
    if (!found.length) return;
    setSummaryLoading(true);
    try {
      setSummary(await runSummary({ data: { query: q, results: found.map((r) => ({ title: r.title.slice(0, 400), snippet: r.snippet, source: r.source })) } }));
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "AI summary failed.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function search(q: string, s: SourceFilter) {
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const found = await runSearch({ data: { query: q, source: s } });
      setResults(found);
      setLoading(false);
      void summarize(q, found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setResults([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search(defaultQuery, "web");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="hud-glass mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="discover-title">
      <p className="w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-bold uppercase text-primary">Live from the internet</p>
      <h2 id="discover-title" className="mt-3 text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>

      <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void search(query, source); }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ideas, videos, posts…" className="h-11 rounded-xl" aria-label="Search the internet" />
        <Button type="submit" className="h-11 rounded-xl" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {sources.map(({ id, label, icon: Icon }) => (
          <Button key={id} type="button" size="sm" variant={source === id ? "default" : "outline"} className="rounded-full" onClick={() => { setSource(id); void search(query, id); }}>
            <Icon /> {label}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} type="button" className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary" onClick={() => { setQuery(s); void search(s, source); }}>{s}</button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-xl border border-destructive/30 bg-danger-soft p-4 text-sm text-destructive">{error}</p>}

      {!error && (summaryLoading || summary || summaryError) && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5" aria-live="polite">
          <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary"><Sparkles className="size-4" /> AI summary</p>
          {summaryLoading && <div className="mt-3 space-y-2"><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-4/5 animate-pulse rounded bg-muted" /><div className="h-3 w-3/5 animate-pulse rounded bg-muted" /></div>}
          {summaryError && <p className="mt-3 text-sm text-destructive">{summaryError}</p>}
          {summary && (
            <>
              <p className="mt-3 text-sm leading-6">{summary.overview}</p>
              {summary.tips.length > 0 && (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {summary.tips.map((t) => <li key={t} className="flex gap-2 rounded-lg border border-border bg-card/60 p-3 text-xs leading-5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{t}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}
      {!error && !loading && results.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No results yet. Try another search.</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && results.length === 0 && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
        {results.map((r) => (
          <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className={`group flex flex-col rounded-xl border border-border bg-secondary/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 ${loading ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-2 text-xs text-primary">
              <img src={`https://www.google.com/s2/favicons?domain=${r.source}&sz=32`} alt="" className="size-4 rounded" loading="lazy" />
              <span className="truncate font-mono">{r.source}</span>
              {r.date && <span className="ml-auto shrink-0 text-muted-foreground">{r.date}</span>}
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-bold group-hover:text-primary">{r.title}</h3>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{r.snippet}</p>
            <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-muted-foreground group-hover:text-primary">Open <ExternalLink className="size-3" /></span>
          </a>
        ))}
      </div>
    </section>
  );
}
