import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { config } from "./utils/config";

import { createGeminiRouter } from "./routes/geminiRoutes";
import { geminiService } from "./services/geminiService";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "10kb" }));

app.use("/api", createGeminiRouter(geminiService));

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
  // If running from /server, static files are in ../dist
  const distPath = path.resolve(process.cwd(), "../dist");
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    void _next;
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mailing list server is running on port ${config.port}`);
});
