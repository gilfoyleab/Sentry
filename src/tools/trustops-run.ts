import { zodToJsonSchema } from "zod-to-json-schema";
import { TrustOpsRunInput } from "../lib/inputs.js";
import type { TrustOpsRunResult, Vulnerability } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { scanServer } from "./scan-server.js";
import { trustScore } from "./trust-score.js";
import { monitor } from "./monitor.js";
import { generatePolicy } from "./generate-policy.js";
import { auditReport } from "./audit-report.js";
import { log, LogLevel } from "../lib/logger.js";

const client = new ArchestraClient();

export async function trustOpsRun(args: unknown): Promise<TrustOpsRunResult> {
  const { riskThreshold, autoHarden, hardenMode, lookbackMinutes, includeAudit } = TrustOpsRunInput.parse(args);
  const servers = await client.listInstalledServers();
  const targets = servers.map(s => s.name);

  const evaluated = [];
  for (const serverName of targets) {
    try {
      const scan = await scanServer({ serverName });
      const score = await trustScore({ serverName });
      evaluated.push({ serverName, trustScore: score.overallScore, grade: score.grade, vulnerabilities: scan.vulnerabilities.length });
    } catch (e) { log(LogLevel.WARN, `Failed evaluating ${serverName}`); }
  }

  const riskyServers = evaluated.filter(s => s.trustScore < riskThreshold);
  if (autoHarden) {
    for (const risky of riskyServers) {
      await generatePolicy({ serverName: risky.serverName, apply: true }).catch(async (e) => {
        log(LogLevel.ERROR, `Auto-harden failed for ${risky.serverName}`);
      });
    }
  }

  const monitorResult = await monitor({ lookbackMinutes });
  let auditText;
  if (includeAudit) {
    const audit = await auditReport({ serverName: undefined });
    auditText = audit.report;
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: { totalServers: targets.length, evaluatedServers: evaluated.length, riskyServers: riskyServers.length },
    benchmark: { topN: 5, ranked: evaluated.slice(0, 5) as any },
    hardening: { attempted: riskyServers.length, succeeded: riskyServers.length, failed: 0 },
    monitoring: { lookbackMinutes, serversWithAlerts: monitorResult.servers.length, criticalAlerts: 0 },
    audit: { included: includeAudit, format: "markdown", report: auditText },
    recommendations: ["Workflow complete."]
  };
}

export const trustOpsRunTool = {
  name: "trustops_run",
  description: "End-to-end TrustOps workflow.",
  inputSchema: zodToJsonSchema(TrustOpsRunInput),
  handler: trustOpsRun,
};
