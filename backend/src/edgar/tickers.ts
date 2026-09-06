import { getTickerFile } from "./client.js";

/** One entry in company_tickers.json.*/
type TickerRow = { cik_str: number; ticker: string; title: string };

const CIK_LENGTH = 10;

const companiesByTicker = new Map<
  string,
  { ticker: string; name: string; cik: string }
>();

function toCompany(row: TickerRow) {
  return {
    ticker: row.ticker.toUpperCase(),
    name: row.title,
    cik: String(row.cik_str).padStart(10, "0"),
  };
}

/** Loaded once at startup — the mapping changes rarely. */
export async function loadTickers(): Promise<void> {
  // The file is an object keyed "0", "1", "2" — not an array.
  const rows = Object.values(
    (await getTickerFile()) as Record<string, TickerRow>,
  );

  for (const row of rows) {
    const company = toCompany(row);
    companiesByTicker.set(company.ticker, company);
  }
}

/** Case-insensitive. Returns undefined for an unknown ticker. */
export function getCompany(input: string): Company | undefined {
  return companiesByTicker.get(input.trim().toUpperCase());
}
