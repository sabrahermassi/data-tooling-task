const BASE = import.meta.env.VITE_API_URL;

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json();
  // Throw the error CODE so the UI can tell 404 from a general failure.
  if (!res.ok) throw new Error(body?.error?.code ?? "UNKNOWN");
  return body;
}

export const getFilings = (p: {
  ticker: string;
  formType: string;
  sort: string;
  page: number;
}) => {
  const q = new URLSearchParams({
    sort: p.sort,
    page: String(p.page),
    pageSize: "20",
  });
  if (p.formType) q.set("formType", p.formType);
  return get(`/companies/${p.ticker}/filings?${q}`);
};

export const getSummary = (tickers: string[]) =>
  get(`/filings/summary?tickers=${tickers.join(",")}`);
