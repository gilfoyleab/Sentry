import { zodToJsonSchema } from "zod-to-json-schema";
import { GeneratePolicyInput } from "../lib/inputs.js";
import type { PolicyResult, Vulnerability } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";
import { scanServer } from "./scan-server.js";

const client = new ArchestraClient();

interface PolicyRecommendation {
  type: "tool_invocation" | "trusted_data";
  toolName: string, toolId: string, action: string, reason: string;
}

function mapVulnerabilityToPolicy(vuln: Vulnerability, toolId: string, mode: any): PolicyRecommendation[] {
  const policies: PolicyRecommendation[] = [];
  const m = mode || "recommended";
  switch (vuln.category) {
    case "Prompt Injection":
    case "Prompt Injection (LLM-detected)":
      policies.push({ type: "tool_invocation", toolId, toolName: vuln.tool, action: (m === "strict" || vuln.severity === "critical") ? "block_always" : "block_when_context_is_untrusted", reason: vuln.description });
      break;
    case "Data Exfiltration Risk":
      policies.push({ type: "trusted_data", toolId, toolName: vuln.tool, action: m === "permissive" ? "mark_as_untrusted" : "sanitize_with_dual_llm", reason: vuln.description });
      break;
    default:
      if (["Excessive Permissions", "Command Injection", "Path Traversal"].includes(vuln.category)) {
        policies.push({ type: "tool_invocation", toolId, toolName: vuln.tool, action: m === "strict" ? "block_always" : "block_when_context_is_untrusted", reason: vuln.description });
      }
  }
  return policies;
}

export async function generatePolicy(args: unknown): Promise<PolicyResult> {
  const { serverName, apply } = GeneratePolicyInput.parse(args);
  const scanResult = await scanServer({ serverName });
  const serverId = await client.resolveServerName(serverName);
  const tools = await client.getServerTools(serverId);
  const toolIdMap = new Map(tools.map(t => [t.name, t.id]));

  const recommendations: PolicyRecommendation[] = [];
  for (const vuln of scanResult.vulnerabilities) {
    const toolId = toolIdMap.get(vuln.tool) || vuln.tool;
    recommendations.push(...mapVulnerabilityToPolicy(vuln, toolId, "recommended"));
  }

  const appliedPolicies = [];
  for (const rec of recommendations) {
    let applied = false;
    if (apply) {
      try {
        if (rec.type === "tool_invocation") await client.createToolInvocationPolicy({ toolId: rec.toolId, action: rec.action as any, conditions: [] });
        else await client.createTrustedDataPolicy({ toolId: rec.toolId, action: rec.action as any });
        applied = true;
      } catch (e) { log(LogLevel.ERROR, `Failed to apply policy for ${rec.toolName}`); }
    }
    appliedPolicies.push({ type: rec.type, toolName: rec.toolName, action: rec.action, reason: rec.reason, applied });
  }

  return { serverName, policiesGenerated: appliedPolicies.length, policies: appliedPolicies };
}

export const generatePolicyTool = {
  name: "generate_policy",
  description: "Generate security policies based on scan results.",
  inputSchema: zodToJsonSchema(GeneratePolicyInput),
  handler: generatePolicy,
};
