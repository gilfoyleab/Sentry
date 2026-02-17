import { zodToJsonSchema } from "zod-to-json-schema";
import { ScanServerInput } from "../lib/inputs.js";
import type { ScanResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";
import { analyzeToolVulnerabilities, calculateBasicTrustScore, detectLethalTrifecta } from "../lib/vulnerability-patterns.js";
import { analyzeWithLlm } from "../lib/prompt-injection.js";

const client = new ArchestraClient();

export async function scanServer(args: unknown): Promise<ScanResult> {
  const { serverName, deep } = ScanServerInput.parse(args);
  log(LogLevel.INFO, `Scanning server: ${serverName}`, { deep });

  const serverId = await client.resolveServerName(serverName);
  const tools = (await client.getServerTools(serverId)).map((t) => ({ ...t, serverName }));
  const allVulnerabilities = [];

  for (const tool of tools) allVulnerabilities.push(...analyzeToolVulnerabilities(tool, tools));
  allVulnerabilities.push(...detectLethalTrifecta(tools));

  if (deep) {
    for (const tool of tools) {
      const findings = await analyzeWithLlm(client, tool.name, tool.description || "");
      allVulnerabilities.push(...findings.map(f => ({
        severity: "high" as const,
        category: "Prompt Injection (LLM-detected)",
        tool: tool.name,
        description: f,
        recommendation: "Review tool definition for hidden instructions."
      })));
    }
  }

  const trustScore = calculateBasicTrustScore(allVulnerabilities);
  const result: ScanResult = { serverName, toolCount: tools.length, vulnerabilities: allVulnerabilities, trustScore, scannedAt: new Date().toISOString() };
  log(LogLevel.INFO, `Scan complete: ${serverName}`, { vulnerabilities: allVulnerabilities.length, trustScore });
  return result;
}

export const scanServerTool = {
  name: "scan_server",
  description: "Analyze an MCP server's tools for security vulnerabilities.",
  inputSchema: zodToJsonSchema(ScanServerInput),
  handler: scanServer,
};
