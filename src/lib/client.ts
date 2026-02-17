import axios from "axios";
import { ArchestraApiError, ServerNotFoundError } from "./errors.js";
import type { McpTool, ToolInvocationPolicy, TrustedDataPolicy } from "./types.js";
import { log, LogLevel } from "./logger.js";

export class ArchestraClient {
    private apiUrl: string;
    private apiKey: string;
    private defaultModel: string;

    constructor() {
        this.apiUrl = process.env.ARCHESTRA_API_URL || "http://localhost:9000";
        this.apiKey = process.env.ARCHESTRA_API_KEY || "";
        this.defaultModel = process.env.LLM_MODEL || "gpt-5-mini";
    }

    async listInstalledServers(): Promise<any[]> {
        try {
            const { data } = await axios.get(`${this.apiUrl}/api/v1/mcp/servers`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            return data;
        } catch (error) {
            throw new ArchestraApiError(`Failed to list servers: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getServerTools(serverId: string): Promise<McpTool[]> {
        try {
            const { data } = await axios.get(`${this.apiUrl}/api/v1/mcp/servers/${serverId}/tools`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            return data;
        } catch (error) {
            throw new ArchestraApiError(`Failed to get tools: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async createToolInvocationPolicy(policy: ToolInvocationPolicy): Promise<any> {
        const { data } = await axios.post(`${this.apiUrl}/api/v1/policies/tool-invocation`, {
            toolId: policy.toolId,
            action: policy.action,
            conditions: [],
            reason: policy.toolName ? `Sentry policy for ${policy.toolName}` : undefined,
        }, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        return data;
    }

    async createTrustedDataPolicy(policy: TrustedDataPolicy): Promise<any> {
        const { data } = await axios.post(`${this.apiUrl}/api/v1/policies/trusted-data`, policy, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        return data;
    }

    async getLogs(lookbackMinutes: number = 60): Promise<any[]> {
        const startTime = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString();
        const { data } = await axios.get(`${this.apiUrl}/api/v1/logs?since=${startTime}&limit=1000`, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        return data;
    }

    async chatCompletion(prompt: string, model?: string): Promise<string> {
        const modelToUse = model || this.defaultModel;
        const groqApiKey = process.env.GROQ_API_KEY;
        const isGroqModel = modelToUse.toLowerCase().includes("llama") || modelToUse.toLowerCase().includes("mixtral") || modelToUse.toLowerCase().includes("deepseek");

        if (groqApiKey && isGroqModel) {
            log(LogLevel.INFO, `Using direct Groq API for completion (model: ${modelToUse})`);
            try {
                const { data } = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                    model: modelToUse,
                    messages: [{ role: "user", content: prompt }],
                }, {
                    headers: {
                        Authorization: `Bearer ${groqApiKey}`,
                        "Content-Type": "application/json"
                    },
                });
                return data.choices[0].message.content;
            } catch (error) {
                log(LogLevel.ERROR, `Groq API failed: ${error instanceof Error ? error.message : String(error)}`);
                log(LogLevel.INFO, "Falling back to Archestra LLM proxy...");
            }
        }

        const { data } = await axios.post(`${this.apiUrl}/api/v1/llm/chat`, {
            model: modelToUse,
            messages: [{ role: "user", content: prompt }],
        }, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        return data.choices[0].message.content;
    }

    async resolveServerName(serverName: string): Promise<string> {
        const servers = await this.listInstalledServers();
        const server = servers.find(s => s.name === serverName || s.catalog_name === serverName);
        if (!server) throw new ServerNotFoundError(serverName);
        return server.id;
    }
}
