import { Router } from "express";
import { getCompany } from "./edgar/tickers.js";
import { getCompanySubmissions } from "./edgar/client.js";
import { normalize } from "./edgar/normalize.js";
import {
  filterByForm,
  sortByDate,
  paginate,
  parsePage,
  parsePageSize,
  parseSort,
} from "./lib/query.js";
import { ApiError } from "./lib/errors.js";

export const router = Router();

router.get("/companies/:ticker/filings", async (req, res, next) => {
  try {
    const company = getCompany(req.params.ticker);
    if (!company) {
      throw new ApiError(
        404,
        "TICKER_NOT_FOUND",
        `No company found for ticker ${req.params.ticker}`,
      );
    }

    const page = parsePage(req.query.page);
    const pageSize = parsePageSize(req.query.pageSize);
    const sort = parseSort(req.query.sort);
    const formType = req.query.formType as string | undefined;

    const submissions = await getCompanySubmissions(company.cik);
    const allFilings = normalize(submissions as any, company.cik);

    // Filter, sort, then page
    const filtered = filterByForm(allFilings, formType);
    const sorted = sortByDate(filtered, sort);
    const { data, pagination } = paginate(sorted, page, pageSize);

    res.json({ company, data, pagination });
  } catch (err) {
    next(err);
  }
});
