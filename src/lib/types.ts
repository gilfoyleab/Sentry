export interface McpTool {
    id: string;
    name: string;
    description?: string;
    inputSchema?: any;
    serverId: string;
    serverName?: string;
}

export interface ToolInvocationPolicy {
    id?: string;
    toolId: string;
    toolName?: string;
    action: "allow" | "deny" | "block_when_context_is_untrusted" | "block_always";
    conditions: any[];
    reason?: string;
}

export interface TrustedDataPolicy {
    id?: string;
    toolId: string;
    action: "sanitize_at_runtime" | "mark_as_untrusted" | "sanitize_with_dual_llm";
    reason?: string;
}
