import { createServerFn } from "@tanstack/react-start";

import { runSummary, summaryInput, type AiSummary } from "./search-core";

export type { AiSummary };

export const summarizeResults = createServerFn({ method: "POST" })
  .inputValidator((data) => summaryInput.parse(data))
  .handler(async ({ data }): Promise<AiSummary> => runSummary(data));
