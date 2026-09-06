import { Router } from "express";
import { getCompany } from "./edgar/tickers.js";
import { getCompanySubmissions } from "./edgar/client.js";
import { normalize } from "./edgar/normalize.js";
import { summarize } from "./lib/summary.js";
import {
  filterByForm,
  sortByDate,
  paginate,
  parsePage,
  parsePageSize,
  parseSort,
} from "./lib/query.js";
import { ApiError } from "./lib/errors.js";

const MAX_TICKERS = 10;
const CONCURRENCY = 5;

export const router = Router();

/**
 * Like Promise.all(items.map(fn)) but with at most `limit` calls in flight.
 * Results are returned in input order.
 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }

  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );

  return results;
}

router.get("/companies/:ticker/filings", async (req, res, next) => {
  try {
    const company = getCompany(req.params.ticker);
    if (!company) {
      throw new ApiError(
        404,
        "TICKER_NOT_FOUND",
        `No company found for ticker ${req.params.ticker}`,
      );
    }

    const page = parsePage(req.query.page);
    const pageSize = parsePageSize(req.query.pageSize);
    const sort = parseSort(req.query.sort);
    const formType = req.query.formType as string | undefined;

    const submissions = await getCompanySubmissions(company.cik);
    const allFilings = normalize(submissions as any, company.cik);

    // Filter, sort, then page
    const filtered = filterByForm(allFilings, formType);
    const sorted = sortByDate(filtered, sort);
    const { data, pagination } = paginate(sorted, page, pageSize);

    res.json({ company, data, pagination });
  } catch (err) {
    next(err);
  }
});

router.get("/filings/summary", async (req, res, next) => {
  try {
    // Split, trim, uppercase, drop empties, deduplicate.
    const tickers = [
      ...new Set(
        String(req.query.tickers ?? "")
          .split(",")
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean),
      ),
    ];

    if (tickers.length === 0) {
      throw new ApiError(400, "MISSING_TICKERS", "tickers is required");
    }
    if (tickers.length > MAX_TICKERS) {
      throw new ApiError(
        400,
        "TOO_MANY_TICKERS",
        `at most ${MAX_TICKERS} tickers`,
      );
    }

    const companies: unknown[] = [];
    const errors: { ticker: string; reason: string }[] = [];

    await mapWithConcurrency(tickers, CONCURRENCY, async (ticker) => {
      const company = getCompany(ticker);
      if (!company) {
        errors.push({ ticker, reason: "not_found" });
        return;
      }
      try {
        const submissions = await getCompanySubmissions(company.cik);
        const filings = normalize(submissions as any, company.cik);
        companies.push({
          ticker: company.ticker,
          name: company.name,
          ...summarize(filings),
        });
      } catch {
        errors.push({ ticker, reason: "upstream_error" });
      }
    });

    // One bad ticker shouldn't lose the others, but all bad is a 404.
    if (companies.length === 0) {
      throw new ApiError(
        404,
        "TICKER_NOT_FOUND",
        "No companies could be resolved",
      );
    }

    res.json({ companies, errors });
  } catch (err) {
    next(err);
  }
});
