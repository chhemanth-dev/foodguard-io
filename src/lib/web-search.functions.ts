import { createServerFn } from "@tanstack/react-start";

import { runSearch, searchInput, type SourceFilter, type WebResult } from "./search-core";

export type { SourceFilter, WebResult };

export const searchWeb = createServerFn({ method: "POST" })
  .inputValidator((data) => searchInput.parse(data))
  .handler(async ({ data }): Promise<WebResult[]> => runSearch(data));
