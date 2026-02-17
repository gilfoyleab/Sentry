import { zodToJsonSchema } from "zod-to-json-schema";
import { MonitorInput } from "../lib/inputs.js";
import type { MonitorResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";

const client = new ArchestraClient();

export async function monitor(args: unknown): Promise<MonitorResult> {
  const { lookbackMinutes } = MonitorInput.parse(args);
  log(LogLevel.INFO, `Monitoring tool calls`, { lookbackMinutes });

  const logs = await client.getLogs(lookbackMinutes);
  const servers = [];
  const serverGroups = new Map();

  for (const log of logs) {
    const name = log.serverName || "unknown";
    if (!serverGroups.has(name)) serverGroups.set(name, []);
    serverGroups.get(name).push(log);
  }

  for (const [srvName, calls] of serverGroups) {
    const errorCount = calls.filter((c: any) => c.error).length;
    servers.push({
      serverName: srvName,
      totalCalls: calls.length,
      errorCount,
      errorRate: Math.round((errorCount / calls.length) * 100) / 100,
      topTools: [],
      alerts: errorCount > 5 ? [{ type: "high_error_rate", severity: "warning", description: "Too many errors", timestamp: new Date().toISOString() }] : []
    });
  }
  return { timeRange: `Last ${lookbackMinutes} minutes`, servers: servers as any };
}

export const monitorTool = {
  name: "monitor",
  description: "Monitor tool calls for anomalies.",
  inputSchema: zodToJsonSchema(MonitorInput),
  handler: monitor,
};
