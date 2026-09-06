import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { router } from "./routes.js";
import { loadTickers } from "./edgar/tickers.js";
import { ApiError } from "./lib/errors.js";
import { PORT } from "./config.js";

const app = express();

app.use(cors());
app.use((req, _res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});
app.use(router);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
});

// Nothing works without the ticker map, so don't start without it.
try {
  await loadTickers();
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
} catch (err) {
  console.error("Could not load SEC ticker list:", err);
  process.exit(1);
}
