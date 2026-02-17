import { zodToJsonSchema } from "zod-to-json-schema";
import { AuditReportInput } from "../lib/inputs.js";
import type { AuditReportResult, ScanResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";
import { scanServer } from "./scan-server.js";
import { trustScore } from "./trust-score.js";
import { monitor } from "./monitor.js";

const client = new ArchestraClient();

export async function auditReport(args: unknown): Promise<AuditReportResult> {
  const { serverName, format } = AuditReportInput.parse(args);
  log(LogLevel.INFO, `Generating audit report`, { serverName, format });

  const servers = serverName ? [{ name: serverName }] : await client.listInstalledServers();
  const scans: ScanResult[] = [];
  const trustScores = [];

  for (const s of servers) {
    try {
      const scan = await scanServer({ serverName: s.name });
      const score = await trustScore({ serverName: s.name });
      scans.push(scan);
      trustScores.push({ serverName: s.name, score: score.overallScore, grade: score.grade });
    } catch (e) { log(LogLevel.WARN, `Failed auditing ${s.name}`); }
  }

  const report = format === "json" ? JSON.stringify({ scans, trustScores }, null, 2) : `# Sentry Audit Report\n\nAudited ${scans.length} servers.`;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalServers: scans.length,
      totalTools: scans.reduce((sum, s) => sum + s.toolCount, 0),
      totalVulnerabilities: scans.reduce((sum, s) => sum + s.vulnerabilities.length, 0),
      criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, averageTrustScore: 0,
      policiesConfigured: 0, policiesMissing: 0
    },
    report,
  };
}

export const auditReportTool = {
  name: "audit_report",
  description: "Generate a security audit report.",
  inputSchema: zodToJsonSchema(AuditReportInput),
  handler: auditReport,
};
