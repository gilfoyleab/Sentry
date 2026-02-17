import { z } from "zod";

export const ScanServerInput = z.object({
    serverName: z.string().describe("Catalog name of the server to scan"),
    deep: z.boolean().optional().default(false).describe("Enable deep LLM analysis"),
});

export const TestServerInput = z.object({
    serverName: z.string().describe("Catalog name of the server to test"),
    testTypes: z.array(z.enum(["valid_input", "edge_cases", "malformed_input", "injection", "overflow"])).optional().default(["valid_input", "injection"]),
});

export const GeneratePolicyInput = z.object({
    serverName: z.string().describe("Catalog name of the server"),
    apply: z.boolean().optional().default(false).describe("Whether to apply the policies immediately"),
});

export const TrustScoreInput = z.object({
    serverName: z.string().describe("Catalog name of the server"),
});

export const MonitorInput = z.object({
    lookbackMinutes: z.number().optional().default(60).describe("How many minutes of logs to analyze"),
});

export const AuditReportInput = z.object({
    serverName: z.string().optional().describe("Analyze a specific server"),
    format: z.enum(["markdown", "json"]).optional().default("markdown").describe("Report format"),
});

export const BenchmarkServersInput = z.object({
    serverNames: z.array(z.string()).optional().describe("Servers to benchmark"),
    topN: z.number().optional().default(5).describe("Top N servers to show"),
});

export const TrustOpsRunInput = z.object({
    riskThreshold: z.number().optional().default(70).describe("Trust score below which to trigger hardening"),
    autoHarden: z.boolean().optional().default(false).describe("Whether to auto-apply security policies"),
    hardenMode: z.enum(["suggest", "strict"]).optional().default("suggest").describe("Hardening strategy"),
    includeAudit: z.boolean().optional().default(true).describe("Whether to include an audit report in results"),
    lookbackMinutes: z.number().optional().default(60).describe("How many minutes of logs to analyze"),
});

export const SimulateRedTeamInput = z.object({
    serverName: z.string().describe("Catalog name of the server to attack"),
    depth: z.enum(["basic", "advanced"]).optional().default("basic").describe("Depth of adversarial testing"),
});

export const AnalyzeDataFlowInput = z.object({
    serverName: z.string().describe("Catalog name of the server to analyze"),
});

export const GenerateTrustBadgeInput = z.object({
    serverName: z.string().describe("Catalog name of the server"),
});
