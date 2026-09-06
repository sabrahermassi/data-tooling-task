# Prompt 1:

given these two links : https://www.sec.gov/search-filings/edgar-application-programming-interfaces and https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data how the sec.gov document URL is constructed. what fields make this URL

# Prompt 2:

I'm building against the SEC EDGAR API and I know nothing about finance. The filing data has a "form" field with values I don't recognise. What are these form types, which ones matter most, and are there any naming conventions or suffixes I should know about? Keep it brief and plain.

# Prompt 3:

Is a 10-K/A considered an annual filing ? because my task requires me to return the date of the company's latest 10-K. should 10-K/A be considered as well ? given that it is a 4 hour timed task

# Prompt 4:

I'm building against the SEC EDGAR submissions API. The task names Apple, Spotify and JPMorgan Chase as companies to test with, but says the code must work for any SEC filer. Are there differences between these three I should know about , anything that would break code written against just one of them?

# Prompt 5:

EDGAR returns filings as parallel arrays, form, filingDate, accessionNumber, primaryDocument, where index i in each array is the same filing. Turn that into an array of objects, one per filing, in TypeScript.

Also build a documentUrl for each from the CIK and accession number: sec.gov/Archives/edgar/data/{cik-without-leading-zeros}/{accession-without-dashes}/{primaryDocument}.

If the arrays aren't all the same length, throw rather than truncating, I'd rather fail loudly than silently return fewer filings than exist.

# Prompt 6:

My filing dates are "YYYY-MM-DD" strings and I compare them as strings to avoid timezone issues. I need a cutoff for "the last 12 months", a function that returns today minus one year in the same "YYYY-MM-DD" format. It should take an optional date parameter so tests can pass a fixed one instead of using today.

# Prompt 7:

Given an array of filings each with form and filingDate (a "YYYY-MM-DD" string), write a function that returns two things: a count of filings per form type within the last 12 months, and the date of the most recent filing where form is exactly "10-K".
The 10-K search must look at all filings, not just the last 12 months, most companies' latest annual report is more than a year old. Return null if there is no 10-K; some foreign filers submit 20-F instead. Take the cutoff as an optional parameter so tests can pass a fixed date.

# Prompt 8:

I need to run an async function over an array of items, but only N at a time, not all at once. EDGAR allows 10 requests per second per IP and each item makes one request, so `Promise.all` over user input is the wrong shape. TypeScript, generic over the item type.

# Prompt 9:

Build a single-page React + TypeScript UI (Vite, plain CSS, no libraries) against two endpoints:

GET /companies/:ticker/filings?formType=&sort=&page=&pageSize= returns { company: {ticker, name, cik}, data: Filing[], pagination: {page, pageSize, total, totalPages} }

GET /filings/summary?tickers=AAPL,SPOT,JPM returns { companies: [{ticker, name, filingCounts, latest10K}], errors: [] }

A Filing is { form, filingDate, accessionNumber, primaryDocument, documentUrl }. latest10K can be null, some foreign filers submit 20-F instead, and the UI must show a dash rather than "undefined".

Needs: a company dropdown plus a free-text ticker box, a form-type filter, a sort toggle, a paginated table with date / form / a link to documentUrl, and a summary table. Handle loading, empty and error states separately, the API throws an error code, so TICKER_NOT_FOUND should show "Company not found" and anything else a generic message. Reset to page 1 when ticker, filter or sort changes.
