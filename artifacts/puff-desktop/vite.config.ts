import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const require = createRequire(import.meta.url);
const projectDir = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

function copyScramjetAssets() {
  const publicDir = path.resolve(projectDir, "public");
  const scramDest = path.resolve(publicDir, "scram");
  const bareDest = path.resolve(publicDir, "baremux");

  let scramjetSrc: string | null = null;
  try {
    const { scramjetPath } = require("@mercuryworkshop/scramjet/path");
    scramjetSrc = scramjetPath;
  } catch (error) {
    throw new Error("Unable to locate installed Scramjet assets.", { cause: error });
  }

  let bareMuxSrc: string | null = null;
  try {
    bareMuxSrc = path.dirname(require.resolve("@mercuryworkshop/bare-mux"));
  } catch (error) {
    throw new Error("Unable to locate installed Bare-Mux assets.", { cause: error });
  }

  if (!scramjetSrc || !existsSync(scramjetSrc)) {
    throw new Error("Scramjet package did not provide a valid asset directory.");
  }
  if (!bareMuxSrc || !existsSync(bareMuxSrc)) {
    throw new Error("Bare-Mux package did not provide a valid asset directory.");
  }

  mkdirSync(publicDir, { recursive: true });
  cpSync(scramjetSrc, scramDest, { recursive: true, force: true });
  cpSync(bareMuxSrc, bareDest, { recursive: true, force: true });
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    {
      name: "copy-scramjet-assets",
      apply: "build",
      buildStart() {
        copyScramjetAssets();
      },
    },
    {
      name: "copy-scramjet-assets-dev",
      apply: "serve",
      configureServer() {
        copyScramjetAssets();
      },
    },
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(projectDir, "..") }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(projectDir, "src"),
      "@assets": path.resolve(projectDir, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: projectDir,
  build: {
    outDir: path.resolve(projectDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
