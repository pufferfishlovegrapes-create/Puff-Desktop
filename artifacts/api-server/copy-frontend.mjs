import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "..", "puff-desktop", "dist", "public");
const serverPublic = path.resolve(__dirname, "dist", "public");

if (existsSync(frontendDist)) {
  mkdirSync(serverPublic, { recursive: true });
  cpSync(frontendDist, serverPublic, { recursive: true, force: true });
  console.log("Copied frontend build to api-server/dist/public");
} else {
  console.warn("Frontend build not found at", frontendDist, "— skipping copy");
}
