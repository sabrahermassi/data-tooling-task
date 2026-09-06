import fs from "node:fs";
import { SEC_USER_AGENT, USE_FIXTURES } from "../config.js";
import { ApiError } from "../lib/errors.js";

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 500;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 2;

const SUBMISSIONS_URL = (cik: string) =>
  `https://data.sec.gov/submissions/CIK${cik}.json`;
const TICKER_FILE_URL = "https://www.sec.gov/files/company_tickers.json";

const cachedByCik = new Map<string, { data: unknown; expiresAt: number }>();

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function readFixture(filename: string): unknown {
  return JSON.parse(fs.readFileSync(`fixtures/${filename}`, "utf8"));
}

async function retry(url: string, attempt: number): Promise<unknown> {
  await sleep(RETRY_DELAY_MS);
  return fetchJson(url, attempt + 1);
}

async function fetchJson(url: string, attempt = 1): Promise<unknown> {
  const canRetry = attempt < MAX_ATTEMPTS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": SEC_USER_AGENT },
      signal: controller.signal,
    });

    // Check status before parsing: EDGAR returns HTML, not JSON, on errors.
    if (!res.ok) {
      if (res.status >= 500 && canRetry) return retry(url, attempt);
      throw new ApiError(502, "UPSTREAM_ERROR", `SEC returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;

    // Network failure or timeout. Do not retry a 403 or 404: per-IP rate limit.
    if (canRetry) return retry(url, attempt);

    throw new ApiError(
      503,
      "UPSTREAM_UNAVAILABLE",
      "Could not reach SEC EDGAR",
    );
  } finally {
    clearTimeout(timer);
  }
}

/** CIK must be zero-padded to 10 digits for this endpoint. */
export async function getCompanySubmissions(cik: string): Promise<unknown> {
  if (USE_FIXTURES) return readFixture("apple.json");

  const cached = cachedByCik.get(cik);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const data = await fetchJson(SUBMISSIONS_URL(cik));
  cachedByCik.set(cik, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

/** Fetched once at startup, so not cached here. */
export async function getTickerFile(): Promise<unknown> {
  if (USE_FIXTURES) return readFixture("tickers.json");
  return fetchJson(TICKER_FILE_URL);
}
