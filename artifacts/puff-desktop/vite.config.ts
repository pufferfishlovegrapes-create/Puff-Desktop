import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const require = createRequire(import.meta.url);
const projectDir = path.dirname(fileURLToPath(import.meta.url));

// A port is only needed by the dev/preview servers. Production builds should
// not fail just because the hosting platform does not define PORT at build time.
const rawPort = process.env.PORT || "5000";
const port = Number(rawPort);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

function copyScramjetAssets() {
  const publicDir = path.resolve(projectDir, "public");

  let scramjetSrc: string;
  let bareMuxSrc: string;
  let libcurlSrc: string;

  try {
    ({ scramjetPath: scramjetSrc } = require("@mercuryworkshop/scramjet/path"));
  } catch (error) {
    throw new Error("Unable to locate Scramjet assets. Check dependency installation.", { cause: error });
  }

  try {
    bareMuxSrc = path.dirname(require.resolve("@mercuryworkshop/bare-mux"));
  } catch (error) {
    throw new Error("Unable to locate Bare-Mux assets. Check dependency installation.", { cause: error });
  }

  try {
    ({ libcurlPath: libcurlSrc } = require("@mercuryworkshop/libcurl-transport"));
  } catch (error) {
    throw new Error("Unable to locate the Libcurl transport assets. Check dependency installation.", { cause: error });
  }

  for (const [name, source] of [
    ["Scramjet", scramjetSrc],
    ["Bare-Mux", bareMuxSrc],
    ["Libcurl transport", libcurlSrc],
  ] as const) {
    if (!source || !existsSync(source)) {
      throw new Error(`${name} asset directory is missing: ${source || "(empty path)"}`);
    }
  }

  mkdirSync(publicDir, { recursive: true });
  cpSync(scramjetSrc, path.join(publicDir, "scram"), { recursive: true, force: true });
  cpSync(bareMuxSrc, path.join(publicDir, "baremux"), { recursive: true, force: true });
  cpSync(libcurlSrc, path.join(publicDir, "libcurl"), { recursive: true, force: true });
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
