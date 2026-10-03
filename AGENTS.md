<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- Keep all detector data access behind `src/lib/detector.functions.ts`; the dashboard uses live cloud readings with the simulator only as a no-data fallback.
- Accept physical detector writes only through `/api/public/detector/readings`, validated and authenticated with the `x-device-key` shared secret.
- Keep public educational content on dedicated TanStack routes (`/waste-guide` and `/innovations`) for direct navigation and route-specific metadata.
- Web search and AI summaries live in `src/lib/search-core.ts`; hosts without Lovable keys (e.g. Vercel) forward to the published `/api/public/search` and `/api/public/summary` routes, since managed keys only exist on Lovable hosting.
- Google sign-in uses the Lovable managed broker on Lovable hosts and falls back to the standard Supabase OAuth redirect elsewhere (e.g. Vercel), because the broker's /~oauth paths only exist on Lovable hosting.
