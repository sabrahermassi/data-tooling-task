import { loadTickers, getCompany } from "./edgar/tickers.js";

await loadTickers();
console.log(getCompany("aapl"));
