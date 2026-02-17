import { zodToJsonSchema } from "zod-to-json-schema";
import { AnalyzeDataFlowInput } from "../lib/inputs.js";
import type { DataFlowResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";

const client = new ArchestraClient();

export async function analyzeDataFlow(args: unknown): Promise<DataFlowResult> {
    const { serverName } = AnalyzeDataFlowInput.parse(args);
    log(LogLevel.INFO, `Analyzing data flow for server: ${serverName}`);

    const serverId = await client.resolveServerName(serverName);
    const tools = await client.getServerTools(serverId);

    let diagram = "graph TD\n";
    diagram += `  Client["User/LLM Client"]\n`;

    const riskChains = [];

    // Group tools by capability for visualization
    for (const tool of tools) {
        diagram += `  ${tool.name.replace(/[^a-zA-Z0-9]/g, "_")}["Tool: ${tool.name}"]\n`;
        diagram += `  Client --> ${tool.name.replace(/[^a-zA-Z0-9]/g, "_")}\n`;

        // Simple heuristic for risk chains (The Lethal Trifecta components)
        if (tool.description?.toLowerCase().includes("fetch") || tool.description?.toLowerCase().includes("web")) {
            diagram += `  ${tool.name.replace(/[^a-zA-Z0-9]/g, "_")} -- "Untrusted Data" --> Client\n`;
            riskChains.push(`Untrusted Content Source: ${tool.name}`);
        }

        if (tool.description?.toLowerCase().includes("email") || tool.description?.toLowerCase().includes("post") || tool.description?.toLowerCase().includes("send")) {
            diagram += `  Client -- "Data Export" --> ${tool.name.replace(/[^a-zA-Z0-9]/g, "_")}\n`;
            riskChains.push(`Exfiltration Vector: ${tool.name}`);
        }

        if (tool.description?.toLowerCase().includes("sudo") || tool.description?.toLowerCase().includes("root") || tool.description?.toLowerCase().includes("execute")) {
            riskChains.push(`Privileged Execution: ${tool.name}`);
        }
    }

    return {
        serverName,
        mermaidDiagram: diagram,
        riskChains,
    };
}

export const analyzeDataFlowTool = {
    name: "analyze_data_flow",
    description: "Analyze tool interactions and generate a Mermaid risk diagram.",
    inputSchema: zodToJsonSchema(AnalyzeDataFlowInput),
    handler: analyzeDataFlow,
};
