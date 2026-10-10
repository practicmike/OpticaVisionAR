// Builds the project into Vercel's Build Output API v3 layout:
//   .vercel/output/static           -> Vite frontend (served by the CDN)
//   .vercel/output/functions/api.func -> Express API bundled into one file
//   .vercel/output/config.json      -> routing (API, SPA fallback, caching)
// Docs: https://vercel.com/docs/build-output-api
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, ".vercel/output");
const staticDir = path.join(out, "static");
const funcDir = path.join(out, "functions/api.func");

rmSync(out, { recursive: true, force: true });

// 1) Frontend
execSync("npx vite build", { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
mkdirSync(staticDir, { recursive: true });
cpSync(path.join(root, "dist/public"), staticDir, { recursive: true });

// 2) API function: one self-contained ESM file (dependencies inlined), so it
//    doesn't depend on node_modules layout or on path aliases at runtime.
mkdirSync(funcDir, { recursive: true });
await build({
  entryPoints: [path.join(root, "server/vercel-handler.ts")],
  outfile: path.join(funcDir, "index.mjs"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  tsconfig: path.join(root, "tsconfig.json"),
  // Dev-only modules never reached from the handler; keep them out explicitly.
  external: ["vite", "lightningcss", "@replit/*", "bufferutil", "utf-8-validate"],
  // CommonJS deps (express) call require() for Node built-ins.
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  logLevel: "info",
});

writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      shouldAddSourcemapSupport: true,
      maxDuration: 10,
    },
    null,
    2,
  ),
);

// 3) Routing
const config = {
  version: 3,
  routes: [
    // Vite assets are content-hashed -> cache forever.
    {
      src: "^/assets/(.*)$",
      headers: { "cache-control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    // 3D models and catalog photos change rarely; cache a day, revalidate after.
    {
      src: "^/frames/(.*)$",
      headers: { "cache-control": "public, max-age=86400, stale-while-revalidate=604800" },
      continue: true,
    },
    // Camera is required by the virtual try-on; deny everything else sensitive.
    {
      src: "^/(.*)$",
      headers: {
        "permissions-policy": "camera=(self), microphone=(), geolocation=()",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
      continue: true,
    },
    { handle: "filesystem" },
    { src: "^/api(/.*)?$", dest: "/api" },
    // SPA fallback for client-side routes (wouter).
    { src: "^/(.*)$", dest: "/index.html" },
  ],
};
writeFileSync(path.join(out, "config.json"), JSON.stringify(config, null, 2));

// 4) Database: create missing tables/columns and load the catalog into empty
//    tables. Vercel exposes DATABASE_URL (Neon integration) during the build,
//    so nobody has to run migrations by hand. A failure here fails the deploy
//    on purpose: shipping an API without its tables would break bookings.
if (process.env.DATABASE_URL) {
  console.log("\nPreparing database...");
  execSync("npx tsx script/seed.ts", { cwd: root, stdio: "inherit" });
} else {
  console.warn("\nDATABASE_URL not set: skipping database setup (API will use in-memory storage).");
}

if (!existsSync(path.join(staticDir, "index.html"))) {
  throw new Error("Frontend build missing index.html");
}
console.log("\nVercel build output ready in .vercel/output");
