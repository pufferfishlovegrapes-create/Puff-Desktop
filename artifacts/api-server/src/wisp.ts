import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";

export async function routeWispUpgrade(
  req: IncomingMessage,
  socket: Socket,
  head: Buffer,
) {
  const { server: wisp } = await import("@mercuryworkshop/wisp-js/server");
  wisp.routeRequest(req, socket, head);
}
