import { useEffect, useState } from "react";
import { getFilings, getSummary } from "./api";

const COMPANIES = [
  { ticker: "AAPL", label: "Apple" },
  { ticker: "SPOT", label: "Spotify" },
  { ticker: "JPM", label: "JPMorgan Chase" },
];

const FORMS = ["10-K", "10-Q", "8-K", "20-F", "6-K", "4"];

type Filing = {
  form: string;
  filingDate: string;
  accessionNumber: string;
  documentUrl: string;
};

export default function App() {
  // What the user picked
  const [ticker, setTicker] = useState("AAPL");
  const [tickerInput, setTickerInput] = useState("");
  const [formType, setFormType] = useState("");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);

  // What came back
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  // Page 8 may not exist in the new result, and a stale error shouldn't
  // survive a new selection.
  useEffect(() => {
    setPage(1);
    setError(null);
  }, [ticker, formType, sort]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    getFilings({ ticker, formType, sort, page })
      .then((r) => {
        if (!ignore) setResult(r);
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // Discards a slow response that lands after a newer one.
    return () => {
      ignore = true;
    };
  }, [ticker, formType, sort, page]);

  // Clear the box on a bad ticker so it's ready for another try.
  useEffect(() => {
    if (error === "TICKER_NOT_FOUND") setTickerInput("");
  }, [error]);

  useEffect(() => {
    getSummary(COMPANIES.map((c) => c.ticker))
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  return (
    <>
      <h1>SEC Filings</h1>

      <div>
        <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
          {COMPANIES.map((c) => (
            <option key={c.ticker} value={c.ticker}>
              {c.label}
            </option>
          ))}
        </select>

        <input
          value={tickerInput}
          placeholder="Any ticker…"
          onChange={(e) => setTickerInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tickerInput.trim()) {
              setTicker(tickerInput.trim().toUpperCase());
              setTickerInput("");
            }
          }}
        />

        <select value={formType} onChange={(e) => setFormType(e.target.value)}>
          <option value="">All forms</option>
          {FORMS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      <Filings
        loading={loading}
        error={error}
        result={result}
        page={page}
        setPage={setPage}
      />

      <h2>Last 12 months</h2>
      <Summary summary={summary} />
    </>
  );
}

function Filings({ loading, error, result, page, setPage }: any) {
  if (loading) return <p>Loading filings…</p>;
  if (error === "TICKER_NOT_FOUND") return <p>Company not found.</p>;
  if (error) return <p>Unable to load filings.</p>;
  if (!result) return null;
  if (result.data.length === 0) return <p>No filings match this filter.</p>;

  const { totalPages, total } = result.pagination;

  return (
    <>
      <h2>
        {result.company.name} — {total} filings
      </h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Form</th>
            <th>Document</th>
          </tr>
        </thead>
        <tbody>
          {result.data.map((f: Filing) => (
            <tr key={f.accessionNumber}>
              <td>{f.filingDate}</td>
              <td>{f.form}</td>
              <td>
                <a href={f.documentUrl} target="_blank" rel="noreferrer">
                  View filing
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span style={{ margin: "0 1rem" }}>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </p>
    </>
  );
}

function Summary({ summary }: any) {
  if (!summary) return <p>Loading summary…</p>;

  // The endpoint returns every form type, 34 columns, mostly dashes.
  // These are the ones worth comparing across companies.
  const forms = ["10-K", "10-Q", "8-K", "20-F", "6-K"];

  return (
    <table>
      <thead>
        <tr>
          <th>Company</th>
          {forms.map((f) => (
            <th key={f}>{f}</th>
          ))}
          <th>Latest 10-K</th>
        </tr>
      </thead>
      <tbody>
        {summary.companies.map((c: any) => (
          <tr key={c.ticker}>
            <td>{c.name}</td>
            {forms.map((f) => (
              <td key={f}>{c.filingCounts[f] ?? "—"}</td>
            ))}
            {/* Em dash, not "undefined", this is the Spotify case. */}
            <td>{c.latest10K ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
