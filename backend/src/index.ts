import { createServer } from "node:http";
import { handleHealth } from "./routes/health.js";

const port = Number(process.env.PORT ?? 3000);

const server = createServer((req, res) => {
  if (req.url === "/health") {
    handleHealth(req, res);
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(port, "localhost", () => {
  console.log(`backend listening on http://localhost:${port}`);
});
