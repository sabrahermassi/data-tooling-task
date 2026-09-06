import { ApiError } from "./errors.js";
import type { Filing } from "../types.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Exact match after uppercasing, so 10-K doesn't catch 10-K/A.
export function filterByForm(filings: Filing[], formType?: string): Filing[] {
  if (!formType) return filings;
  const wanted = formType.trim().toUpperCase();
  return filings.filter((f) => f.form.toUpperCase() === wanted);
}

// Dates are YYYY-MM-DD, so text comparison sorts correctly and dodges
// the timezone shift you'd get from parsing to Date.
export function sortByDate(filings: Filing[], order: "asc" | "desc"): Filing[] {
  return [...filings].sort((a, b) =>
    order === "desc"
      ? b.filingDate.localeCompare(a.filingDate)
      : a.filingDate.localeCompare(b.filingDate),
  );
}

// total counts the filtered set, before slicing.
export function paginate(filings: Filing[], page: number, pageSize: number) {
  const total = filings.length;
  const start = (page - 1) * pageSize;

  return {
    data: filings.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Strict: rejects "1.5", "1e2" and " 1", which Number() would all accept.
function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}

export function parsePage(value: unknown): number {
  if (value === undefined) return 1;
  const n = parsePositiveInt(value);
  if (n === null) {
    throw new ApiError(400, "INVALID_PAGE", "page must be a positive integer");
  }
  return n;
}

export function parsePageSize(value: unknown): number {
  if (value === undefined) return DEFAULT_PAGE_SIZE;
  const n = parsePositiveInt(value);
  if (n === null || n > MAX_PAGE_SIZE) {
    throw new ApiError(
      400,
      "INVALID_PAGE_SIZE",
      `pageSize must be a positive integer up to ${MAX_PAGE_SIZE}`,
    );
  }
  return n;
}

export function parseSort(value: unknown): "asc" | "desc" {
  if (value === undefined) return "desc";
  const order = String(value).toLowerCase();
  if (order !== "asc" && order !== "desc") {
    throw new ApiError(400, "INVALID_SORT", 'sort must be "asc" or "desc"');
  }
  return order;
}
