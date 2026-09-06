import type { Filing } from "../types.js";

/**
 * Returns the date one year before `from` as "YYYY-MM-DD".
 * Uses UTC throughout so the result doesn't shift depending on the
 * server's timezone. Feb 29 rolls forward to Mar 1 of the prior year
 * when that year isn't a leap year (matches JS Date semantics).
 */
export function oneYearAgo(from: Date = new Date()): string {
  const d = new Date(
    Date.UTC(from.getUTCFullYear() - 1, from.getUTCMonth(), from.getUTCDate()),
  );
  return d.toISOString().slice(0, 10);
}

export function summarize(filings: Filing[], cutoff: string = oneYearAgo()) {
  const filingCounts: Record<string, number> = {};
  let latest10K: string | null = null;

  for (const filing of filings) {
    // Inclusive at the boundary.
    if (filing.filingDate >= cutoff) {
      filingCounts[filing.form] = (filingCounts[filing.form] ?? 0) + 1;
    }

    // Deliberately outside the cutoff check, the last annual report is
    // usually more than a year old.
    if (
      filing.form === "10-K" &&
      (latest10K === null || filing.filingDate > latest10K)
    ) {
      latest10K = filing.filingDate;
    }
  }

  return { filingCounts, latest10K };
}
