import express, { type Request, type Response } from "express";
import cors from "cors";
import { ALGORITHMS, compressAll, type Algorithm } from "./compress.js";

const MAX_INPUT_BYTES = 1_000_000; // 1 MB guard for the playground.

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", algorithms: ALGORITHMS });
  });

  app.post("/api/compress", (req: Request, res: Response) => {
    const { text } = req.body as { text?: unknown };

    if (typeof text !== "string") {
      return res.status(400).json({ error: "Request body must include a 'text' string." });
    }

    const byteLength = Buffer.byteLength(text, "utf8");
    if (byteLength > MAX_INPUT_BYTES) {
      return res.status(413).json({
        error: `Input is too large (${byteLength} bytes). Limit is ${MAX_INPUT_BYTES} bytes.`,
      });
    }

    const results = compressAll(text);
    const best = results.reduce((a, b) => (b.compressedBytes < a.compressedBytes ? b : a));

    res.json({
      originalBytes: byteLength,
      results,
      best: best.algorithm satisfies Algorithm,
    });
  });

  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT ?? 4000);
  const app = createApp();
  app.listen(port, () => {
    console.log(`BustaClaw server listening on http://localhost:${port}`);
  });
}
