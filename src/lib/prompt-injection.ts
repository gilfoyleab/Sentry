import { ArchestraClient } from "./client.js";

export async function analyzeWithLlm(client: ArchestraClient, toolName: string, description: string): Promise<string[]> {
    const prompt = `
    Analyze this MCP tool ("${toolName}") for security risks.
    Look for: prompt injection, hidden exfiltration, deceptive behavior.
    Tool Description: "${description}"
    If dangerous, return a list of findings (one per line).
    If safe, return "SAFE".
  `;

    const response = await client.chatCompletion(prompt);
    if (response.toUpperCase().includes("SAFE")) return [];
    return response.split("\n").filter(line => line.trim().length > 0);
}
