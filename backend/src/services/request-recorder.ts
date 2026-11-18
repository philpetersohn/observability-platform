import type { RequestRecord } from "../types.js";

function percentile(values: number[], percentage: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((percentage / 100) * sorted.length) - 1);
  return Math.round(sorted[index] * 10) / 10;
}

export class RequestRecorder {
  private readonly records: RequestRecord[] = [];
  private readonly maxRecords = 1_000;

  record(record: RequestRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) this.records.shift();
  }

  getSnapshot() {
    const cutoff = Date.now() - 5 * 60 * 1_000;
    const recent = this.records.filter((record) => Date.parse(record.timestamp) >= cutoff);
    const latencies = recent.map((record) => record.durationMs);
    const serverErrors = recent.filter((record) => record.statusCode >= 500).length;
    const clientErrors = recent.filter((record) => record.statusCode >= 400 && record.statusCode < 500).length;
    const grouped = new Map<string, RequestRecord[]>();

    for (const record of recent) {
      const key = `${record.method} ${record.path}`;
      const group = grouped.get(key) ?? [];
      group.push(record);
      grouped.set(key, group);
    }

    const routes = [...grouped.entries()].map(([route, records]) => ({
      route,
      requestCount: records.length,
      serverErrors: records.filter((record) => record.statusCode >= 500).length,
      averageLatencyMs: Math.round((records.reduce((sum, record) => sum + record.durationMs, 0) / records.length) * 10) / 10,
      p95LatencyMs: percentile(records.map((record) => record.durationMs), 95),
    })).sort((a, b) => b.requestCount - a.requestCount);

    return {
      window: "5m",
      totalRequests: recent.length,
      serverErrors,
      clientErrors,
      serverErrorRatePct: recent.length ? Math.round((serverErrors / recent.length) * 1_000) / 10 : 0,
      averageLatencyMs: latencies.length ? Math.round((latencies.reduce((sum, value) => sum + value, 0) / latencies.length) * 10) / 10 : 0,
      p95LatencyMs: percentile(latencies, 95),
      routes,
    };
  }
}
