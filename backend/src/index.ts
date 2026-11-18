import { createApiServer } from "./server.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const app = createApiServer();

const simulationTimer = setInterval(() => {
  app.telemetryStore.tick();
}, 5_000);

app.server.listen(port, host, () => {
  console.log("Observability API listening on http://" + host + ":" + port);
  console.log("API reference: http://" + host + ":" + port + "/api/docs");
});

function shutdown(signal: string): void {
  console.log("Received " + signal + "; shutting down gracefully.");
  clearInterval(simulationTimer);
  app.server.close((error) => {
    if (error) {
      console.error("Error closing HTTP server:", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
