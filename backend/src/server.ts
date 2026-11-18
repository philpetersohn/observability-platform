import { createServer } from "node:http";
import { handleApiRequest } from "./routes/api.js";
import { RequestRecorder } from "./services/request-recorder.js";
import { TelemetryStore } from "./services/telemetry-store.js";

export function createApiServer() {
  const telemetryStore = new TelemetryStore();
  const requestRecorder = new RequestRecorder();
  const server = createServer((request, response) => {
    handleApiRequest(request, response, telemetryStore, requestRecorder);
  });
  return { server, telemetryStore, requestRecorder };
}
