import { ApiError } from "../lib/errors.js";
import type { Filing } from "../types.js";

// CIK without leading zeros, accession without dashes.
export function buildDocumentUrl(
  cik: string,
  accession: string,
  primaryDocument: string,
): string {
  const cikNoZeros = String(Number(cik));
  const folder = accession.replace(/-/g, "");

  return `https://www.sec.gov/Archives/edgar/data/${cikNoZeros}/${folder}/${primaryDocument}`;
}

// The four fields we use from EDGAR's recent.filings
export type EdgarSubmissions = {
  filings?: {
    recent?: {
      form?: string[];
      filingDate?: string[];
      accessionNumber?: string[];
      primaryDocument?: string[];
    };
  };
};

export function normalize(
  submissions: EdgarSubmissions,
  cik: string,
): Filing[] {
  const recent = submissions?.filings?.recent;

  // A filer with no filings is valid, not an error.
  if (!recent) return [];

  const { form, filingDate, accessionNumber, primaryDocument } = recent;

  if (
    !Array.isArray(form) ||
    !Array.isArray(filingDate) ||
    !Array.isArray(accessionNumber) ||
    !Array.isArray(primaryDocument)
  ) {
    throw new ApiError(
      502,
      "UPSTREAM_ERROR",
      "SEC response is missing a column",
    );
  }

  // Item i in every column is the same filing.
  return form.map((formType, i) => ({
    form: formType,
    filingDate: filingDate[i]!,
    accessionNumber: accessionNumber[i]!,
    primaryDocument: primaryDocument[i]!,
    documentUrl: buildDocumentUrl(
      cik,
      accessionNumber[i]!,
      primaryDocument[i]!,
    ),
  }));
}
