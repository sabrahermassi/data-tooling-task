export type ErrorCode =
  | "INVALID_PAGE"
  | "INVALID_PAGE_SIZE"
  | "INVALID_SORT"
  | "TICKER_NOT_FOUND"
  | "MISSING_TICKERS"
  | "TOO_MANY_TICKERS"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
