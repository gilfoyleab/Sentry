import { zodToJsonSchema } from "zod-to-json-schema";
import { TrustScoreInput } from "../lib/inputs.js";
import type { TrustScoreResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";
import { scanServer } from "./scan-server.js";
import { calculateTrustScore } from "../lib/scoring.js";

const client = new ArchestraClient();

export async function trustScore(args: unknown): Promise<TrustScoreResult> {
  const { serverName } = TrustScoreInput.parse(args);
  log(LogLevel.INFO, `Calculating trust score for ${serverName}`);

  const scanResult = await scanServer({ serverName });
  const serverId = await client.resolveServerName(serverName);
  const tools = (await client.getServerTools(serverId)).map(t => ({ ...t, serverName }));

  return calculateTrustScore({
    tools,
    vulnerabilities: scanResult.vulnerabilities,
    toolInvocationPolicies: [],
    trustedDataPolicies: [],
  });
}

export const trustScoreTool = {
  name: "trust_score",
  description: "Calculate comprehensive trust score.",
  inputSchema: zodToJsonSchema(TrustScoreInput),
  handler: trustScore,
};
