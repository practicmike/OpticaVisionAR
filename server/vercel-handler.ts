import { createApp } from "./app";

// Vercel Function entry. Bundled by script/build-vercel.mjs into
// .vercel/output/functions/api.func/index.mjs. Every /api/* request is
// routed here with its original URL, so the Express routes match unchanged.
const app = createApp();

export default app;
