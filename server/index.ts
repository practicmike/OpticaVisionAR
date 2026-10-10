import { createServer } from "http";
import { createApp, log } from "./app";
import { setupVite, serveStatic } from "./vite";

// Local / Replit entry point. On Vercel the API runs from api/index.ts and
// the frontend is served as static files, so this file isn't used there.
(async () => {
  const app = createApp();
  const server = createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
