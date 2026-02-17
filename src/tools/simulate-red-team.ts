import { zodToJsonSchema } from "zod-to-json-schema";
import { SimulateRedTeamInput } from "../lib/inputs.js";
import type { RedTeamResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";

const client = new ArchestraClient();

export async function simulateRedTeam(args: unknown): Promise<RedTeamResult> {
    const { serverName, depth } = SimulateRedTeamInput.parse(args);
    log(LogLevel.INFO, `Starting Red Team simulation on server: ${serverName}`, { depth });

    const serverId = await client.resolveServerName(serverName);
    const tools = await client.getServerTools(serverId);
    const attacks: RedTeamResult["attacks"] = [];

    for (const tool of tools) {
        const prompt = `
      You are a professional security Red Team researcher. 
      Analyze this MCP tool: "${tool.name}"
      Description: "${tool.description || "No description"}"
      Schema: ${JSON.stringify(tool.inputSchema)}

      Generate 3 highly targeted adversarial payloads to test for security vulnerabilities 
      (e.g., Prompt Injection, Command Injection, Path Traversal, Deceptive Behavior).
      
      For each payload, return a JSON object with:
      {"attackType": "...", "payload": "...", "simulatedOutcome": "...", "riskLevel": "..."}
      
      Return ONLY a JSON array.
    `;

        try {
            const response = await client.chatCompletion(prompt);
            const cleanedResponse = response.substring(response.indexOf("["), response.lastIndexOf("]") + 1);
            const generatedAttacks = JSON.parse(cleanedResponse);

            for (const attack of generatedAttacks) {
                attacks.push({
                    tool: tool.name,
                    attackType: attack.attackType,
                    payload: attack.payload,
                    simulatedOutcome: attack.simulatedOutcome,
                    riskLevel: attack.riskLevel.toLowerCase() as any,
                });
            }
        } catch (e) {
            log(LogLevel.ERROR, `Failed to generate attacks for tool ${tool.name}`);
        }
    }

    return {
        serverName,
        payloadsGenerated: attacks.length,
        attacks,
    };
}

export const simulateRedTeamTool = {
    name: "simulate_red_team",
    description: "Generate adversarial payloads to simulate a security red-team attack.",
    inputSchema: zodToJsonSchema(SimulateRedTeamInput),
    handler: simulateRedTeam,
};
