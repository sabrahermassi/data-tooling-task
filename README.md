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

`SEC_USER_AGENT` is required — your name and email, e.g.
`Jane Doe jane@example.com`. EDGAR returns 403 without it.
`USE_FIXTURES` is a dev-only flag for reading a saved response instead of
calling EDGAR; leave it false.

## API

    GET /companies/:ticker/filings?formType=&sort=&page=&pageSize=
    -> { company, data: Filing[], pagination }

    GET /filings/summary?tickers=AAPL,SPOT,JPM
    -> { companies: [{ ticker, name, filingCounts, latest10K }], errors }

Defaults: newest first, page 1, 20 per page (max 100). `formType` is an
exact match. A ticker that doesn't resolve lands in `errors` rather than
failing the whole request. `latest10K` is null for foreign filers like
Spotify, which submit 20-F instead.

Errors are `{ error: { code, message } }` — see `requests.http` for
runnable examples including the failure cases.

## Notes

See NOTES.md for the decisions behind it and what's missing.
PROMPTS.md documents AI usage.
