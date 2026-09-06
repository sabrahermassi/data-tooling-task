import { Router } from "express";
import { getCompany } from "./edgar/tickers.js";
import { getCompanySubmissions } from "./edgar/client.js";
import { normalize } from "./edgar/normalize.js";
import { ApiError } from "./lib/errors.js";

export const router = Router();

router.get("/companies/:ticker/filings", async (req, res, next) => {
  try {
    // Unknown ticker fails here, before EDGAR is called.
    const company = getCompany(req.params.ticker);
    if (!company) {
      throw new ApiError(
        404,
        "TICKER_NOT_FOUND",
        `No company found for ticker ${req.params.ticker}`,
      );
    }

    const submissions = await getCompanySubmissions(company.cik);
    const data = normalize(submissions as any, company.cik);

    res.json({ company, data });
  } catch (err) {
    next(err);
  }
});
