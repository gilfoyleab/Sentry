import { zodToJsonSchema } from "zod-to-json-schema";
import { BenchmarkServersInput } from "../lib/inputs.js";
import type { BenchmarkResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";
import { scanServer } from "./scan-server.js";
import { trustScore } from "./trust-score.js";

const client = new ArchestraClient();

export async function benchmarkServers(args: unknown): Promise<BenchmarkResult> {
  const { serverNames, topN } = BenchmarkServersInput.parse(args);
  const servers = serverNames ? serverNames.map((n: string) => ({ name: n })) : await client.listInstalledServers();
  const targets = (servers as any[]).map((s: any) => s.name);

  const ranked = [];
  const failed = [];

  for (const serverName of targets) {
    try {
      const scan = await scanServer({ serverName });
      const score = await trustScore({ serverName });
      ranked.push({
        serverName, trustScore: score.overallScore, grade: score.grade,
        vulnerabilityCount: scan.vulnerabilities.length,
        criticalCount: 0, highCount: 0, riskIndex: 0
      });
    } catch (e) {
      failed.push({ serverName, error: e instanceof Error ? e.message : String(e) });
    }
  }

  ranked.sort((a, b) => b.trustScore - a.trustScore);

  return {
    generatedAt: new Date().toISOString(),
    totalAnalyzed: targets.length,
    ranked: ranked.slice(0, topN),
    failed,
  };
}

export const benchmarkServersTool = {
  name: "benchmark_servers",
  description: "Rank MCP servers by trust and risk.",
  inputSchema: zodToJsonSchema(BenchmarkServersInput),
  handler: benchmarkServers,
};
