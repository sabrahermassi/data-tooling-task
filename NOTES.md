# NOTES.md

All four requirements are implemented and working. What follows is the
reasoning behind the decisions the brief left open, and what I did not
get to.

## Decisions

**Filtering and sorting run on the server, before paging.** Doing either
afterwards would only affect the rows on screen, and the totals would be
wrong. It's a correctness argument rather than a preference — which is
also why they can't live in the frontend, since React only has one page.

**Dates are compared as strings.** They arrive as `YYYY-MM-DD`, which
sorts correctly as text. Parsing to `Date` risks a timezone shift that
moves filings across the 12-month boundary — producing counts that look
entirely reasonable and are wrong.

**`latest10K` searches all filings, not the 12-month window.** Most
companies' last annual report is over a year old, so reusing the windowed
list would return null for nearly everyone. The cutoff applies to the
counts only.

**Only exact `10-K` counts**, not `10-K/A` amendments. Simpler and more
predictable, and it keeps form filtering consistent with the same rule.
Arguably the weaker reading — an amended annual report is still the
annual report — so if a company amends, I show the original date.

**The CIK is formatted two ways** — padded to 10 digits for the
submissions URL, stripped of leading zeros for the document URL. Same
number, and using the wrong one gives a 404 that looks like a missing
filing. Verified against a real filing before building on it.

**The summary fetches at most 5 companies at once.** EDGAR allows 10
requests per second per IP, and each ticker is one call. An unbounded
`Promise.all` over user input works for three and breaks at fifty.

**No database.** EDGAR is the source of truth and nothing needs to
persist. Submissions are cached in memory for five minutes: EDGAR permits
filings to be corrected or withdrawn after acceptance, so the expiry is a
staleness decision rather than a speed one.

**The summary table shows five form types**, not all of them. The
endpoint returns every type; displaying all 34 would be mostly dashes,
dominated by insider filings and prospectus supplements. The brief left
the display format open.

## What's missing

**No tests.** The four requirements were verified manually against the
live API — see `requests.http`, which covers the endpoints and the error
cases. The two worth writing first are the columnar reshaping (fields
coming from different records would be invisible) and the 12-month
boundary (an off-by-one produces plausible wrong counts). Both are the
kind of bug that can't be spotted by clicking around.

**`filings.recent` is a window**, holding a year of filings or the most
recent 1,000, whichever is larger. Older history sits in `filings.files`,
which I don't follow. In practice the 12-month counts are complete, but a
company filing more than 1,000 times in under a year could have its
latest 10-K fall outside the window and return null despite having one.
Following `filings.files` is the fix.

**The summary is fixed to three companies in the UI.** The endpoint takes
any set of up to ten; the frontend calls it with the three the brief
names. A second input for a comma-separated list would be about ten
minutes.

**Filters aren't reflected in the URL**, so links aren't shareable and
the back button doesn't undo a filter change.

**Errors replace the table** rather than appearing beside the input.
Keeping the last successful result visible while showing the error would
be less jarring.
