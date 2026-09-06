export type ErrorCode =
  | "TICKER_NOT_FOUND"
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
