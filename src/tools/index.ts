
import { scanServerTool } from "./scan-server.js";
import { testServerTool } from "./test-server.js";
import { generatePolicyTool } from "./generate-policy.js";
import { trustScoreTool } from "./trust-score.js";
import { monitorTool } from "./monitor.js";
import { auditReportTool } from "./audit-report.js";
import { benchmarkServersTool } from "./benchmark-servers.js";
import { trustOpsRunTool } from "./trustops-run.js";
import { simulateRedTeamTool } from "./simulate-red-team.js";
import { analyzeDataFlowTool } from "./analyze-data-flow.js";
import { generateTrustBadgeTool } from "./generate-trust-badge.js";
import { chatWithSentryTool } from "./chat.js";

export const tools = [
  auditReportTool,
  benchmarkServersTool,
  trustOpsRunTool,
  simulateRedTeamTool,
  analyzeDataFlowTool,
  generateTrustBadgeTool,
  scanServerTool,
  testServerTool,
  generatePolicyTool,
  trustScoreTool,
  monitorTool,
  chatWithSentryTool,
];

const toolMap = new Map(tools.map((t) => [t.name, t]));

export async function executeTool(toolName: string, args: unknown) {
  const tool = toolMap.get(toolName);
  if (!tool) throw new Error(`Tool "${toolName}" not found`);
  return await tool.handler(args);
}
