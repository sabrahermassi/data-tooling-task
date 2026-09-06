import { loadTickers, getCompany } from "./edgar/tickers.js";
import { getCompanySubmissions } from "./edgar/client.js";
import { normalize } from "./edgar/normalize.js";

await loadTickers();

const company = getCompany("aapl")!;
const submissions = await getCompanySubmissions(company.cik);
const filings = normalize(submissions as any, company.cik);

console.log("count:", filings.length);
console.log(filings[0]);
