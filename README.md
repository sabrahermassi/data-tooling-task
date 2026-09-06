# SEC EDGAR Filing Explorer

Browse a company's SEC filings by ticker, and compare filing activity
across companies over the last 12 months.

## Running

Two terminals.

    cd backend
    npm install
    cp .env.example .env     # set SEC_USER_AGENT
    npm run dev              # :3000

    cd frontend
    npm install
    cp .env.example .env     # VITE_API_URL, default is fine
    npm run dev              # :5173

Then open http://localhost:5173.

`SEC_USER_AGENT` is required, your name and email, e.g.
`Jane Doe jane@example.com`. EDGAR returns 403 without it.
`USE_FIXTURES` is a dev-only flag for reading a saved response instead of
calling EDGAR; leave it false.

The frontend needs `frontend/.env` with `VITE_API_URL=http://localhost:3000`.

## API

    GET /companies/:ticker/filings?formType=&sort=&page=&pageSize=
    -> { company, data: Filing[], pagination }

    GET /filings/summary?tickers=AAPL,SPOT,JPM
    -> { companies: [{ ticker, name, filingCounts, latest10K }], errors }

Defaults: newest first, page 1, 20 per page (max 100). `formType` is an
exact match. A ticker that doesn't resolve lands in `errors` rather than
failing the whole request. `latest10K` is null for foreign filers like
Spotify, which submit 20-F instead.

Errors are `{ error: { code, message } }` - see `requests.http` for
runnable examples including the failure cases.

## Decisions

- **Filtering and sorting run on the server, before paging.** Doing
  either afterwards would only affect the rows on screen, and the totals
  would be wrong.
- **Dates are compared as strings.** `YYYY-MM-DD` sorts correctly as
  text; parsing to `Date` risks a timezone shift across the 12-month
  boundary.
- **`latest10K` searches all filings, not the 12-month window** - most
  companies' last annual report is over a year old.
- **Only exact `10-K` counts**, not `10-K/A` amendments.
- **The CIK is formatted two ways** - padded to 10 digits for the
  submissions URL, stripped of leading zeros for the document URL.
- **`filings.recent` is a window** (a year, or 1,000 filings). I don't
  follow `filings.files`, so a very high-volume filer could have its
  latest 10-K fall outside it.
- **The summary fetches at most 5 companies at once** - EDGAR allows 10
  requests/second per IP.
- **No database.** Submissions are cached in memory for five minutes:
  EDGAR permits filings to be corrected after acceptance, so the expiry
  is a staleness decision rather than a speed one.
- **The summary table shows five form types**, not all of them. The
  endpoint returns every type; displaying all 34 would be mostly dashes.
  The brief left the display format open.
  - **No tests.** The four requirements were verified manually against the
    live API - see `requests.http`. The two worth writing first are the
    columnar reshaping and the 12-month boundary, since both can produce a
    wrong answer that looks reasonable.

## AI usage

See PROMPTS.md.
