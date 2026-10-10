import express, { type Request, type Response, type NextFunction } from "express";
import { registerApiRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Builds the Express app (middleware + API) without binding a port, so the
 * same app runs locally (server/index.ts) and as a Vercel function (api/).
 */
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false }));

  // Request log for /api. Response bodies are NOT logged: they contain
  // personal data (names, emails, phones) from appointments and contact forms.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
      }
    });
    next();
  });

  registerApiRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    console.error(err);
    if (res.headersSent) return;
    res.status(status).json({ message: status >= 500 ? "Internal Server Error" : err.message });
  });

  return app;
}
