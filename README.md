# SEC EDGAR Filing Explorer

Browse a company's SEC filings by ticker.

## Backend

    cd backend
    npm install
    cp .env.example .env
    npm run dev          # :3000

### Environment

Copy `.env.example` to `.env` and set:

**`SEC_USER_AGENT`** — required. Your name and email, e.g.
`Jane Doe jane@example.com`. EDGAR returns 403 without it.

**`PORT`** — optional, defaults to 3000.

**`USE_FIXTURES`** — optional, defaults to `false`. Leave it false.
Setting it true reads saved EDGAR responses from `backend/fixtures/`
instead of calling the live API. I used it while building so the dev
server wasn't re-fetching on every file save and hitting EDGAR's
10 requests/second limit. The fixtures aren't committed.
