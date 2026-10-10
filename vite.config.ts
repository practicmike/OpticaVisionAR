import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// MediaPipe FaceMesh loads its WASM + model files at runtime. They are served
// from this site (copied from node_modules) instead of a CDN, so the version
// always matches the installed JS package and no third party is in the path.
const faceMeshDir = path.resolve(import.meta.dirname, "node_modules/@mediapipe/face_mesh");
const faceMeshVersion: string = JSON.parse(
  fs.readFileSync(path.join(faceMeshDir, "package.json"), "utf-8"),
).version;
const faceMeshBase = `/mediapipe/face_mesh/${faceMeshVersion}/`;
const faceMeshFiles = fs
  .readdirSync(faceMeshDir)
  .filter((file) => /\.(wasm|data|binarypb)$/.test(file) || /_(wasm_bin|loader)\.js$/.test(file));

const contentTypes: Record<string, string> = {
  ".wasm": "application/wasm",
  ".js": "text/javascript",
  ".data": "application/octet-stream",
  ".binarypb": "application/octet-stream",
};

function mediapipeFaceMeshAssets(): Plugin {
  return {
    name: "mediapipe-face-mesh-assets",
    // Dev server: stream the files straight from node_modules.
    configureServer(server) {
      server.middlewares.use(faceMeshBase, (req, res, next) => {
        const file = (req.url ?? "").split("?")[0].replace(/^\//, "");
        if (!faceMeshFiles.includes(file)) return next();
        res.setHeader("Content-Type", contentTypes[path.extname(file)] ?? "application/octet-stream");
        fs.createReadStream(path.join(faceMeshDir, file)).pipe(res);
      });
    },
    // Production build: emit them next to the app bundle.
    generateBundle() {
      for (const file of faceMeshFiles) {
        this.emitFile({
          type: "asset",
          fileName: `${faceMeshBase.slice(1)}${file}`,
          source: fs.readFileSync(path.join(faceMeshDir, file)),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    mediapipeFaceMeshAssets(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  define: {
    __FACE_MESH_ASSETS__: JSON.stringify(faceMeshBase),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
