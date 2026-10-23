import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { routeWispUpgrade } from "./wisp";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "public");

if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;

export function createHttpServer() {
  const server = createServer(app);
  server.on("upgrade", async (req, socket, head) => {
    if (req.url?.startsWith("/wisp/")) {
      try {
        await routeWispUpgrade(req, socket, head);
      } catch (err) {
        logger.error({ err }, "Wisp upgrade error");
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  });
  return server;
}
