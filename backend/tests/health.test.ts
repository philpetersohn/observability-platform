import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleHealth } from "../src/routes/health.js";

describe("handleHealth", () => {
  it("responds with ok", () => {
    let status = 0;
    let body = "";

    const res = {
      writeHead(code: number) {
        status = code;
      },
      end(payload: string) {
        body = payload;
      },
    };

    const handled = handleHealth({} as never, res as never);

    assert.equal(handled, true);
    assert.equal(status, 200);
    assert.deepEqual(JSON.parse(body), { ok: true });
  });
});
