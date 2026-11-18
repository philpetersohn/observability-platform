import type { IncomingMessage, ServerResponse } from "node:http";

export function handleHealth(_req: IncomingMessage, res: ServerResponse): boolean {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
  return true;
}
