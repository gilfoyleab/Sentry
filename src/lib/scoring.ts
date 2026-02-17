import type { Vulnerability, TrustScoreResult } from "./outputs.js";
import type { McpTool, ToolInvocationPolicy, TrustedDataPolicy } from "./types.js";

interface ScoringContext {
    tools: McpTool[];
    vulnerabilities: Vulnerability[];
    toolInvocationPolicies: ToolInvocationPolicy[];
    trustedDataPolicies: TrustedDataPolicy[];
}

function scoreToolDescriptionSafety(ctx: ScoringContext): number {
    let score = 100;
    const descVulns = ctx.vulnerabilities.filter(v => ["Prompt Injection", "Prompt Injection (LLM-detected)", "ANSI/Steganography Attack"].includes(v.category));
    for (const v of descVulns) score -= v.severity === "critical" ? 40 : v.severity === "high" ? 25 : 15;
    return Math.max(0, score);
}

function scoreInputValidation(ctx: ScoringContext): number {
    let score = 100;
    const validationVulns = ctx.vulnerabilities.filter(v => v.category === "Missing Input Validation");
    score -= Math.min(validationVulns.length * 10, 60);
    if (ctx.tools.length > 0 && ctx.tools.every(t => t.inputSchema?.properties && Object.keys(t.inputSchema.properties).length > 0)) score = Math.min(score + 10, 100);
    return Math.max(0, score);
}

function scorePermissionScope(ctx: ScoringContext): number {
    let score = 100;
    const permVulns = ctx.vulnerabilities.filter(v => ["Excessive Permissions", "Command Injection", "Path Traversal"].includes(v.category));
    for (const v of permVulns) score -= v.severity === "critical" ? 35 : v.severity === "high" ? 20 : 10;
    return Math.max(0, score);
}

function scoreDataHandling(ctx: ScoringContext): number {
    let score = 100;
    const dataVulns = ctx.vulnerabilities.filter(v => ["Data Exfiltration Risk", "PII Exposure", "Lethal Trifecta"].includes(v.category));
    for (const v of dataVulns) score -= v.severity === "critical" ? 40 : v.severity === "high" ? 20 : 12;
    return Math.max(0, score);
}

function scoreToolIntegrity(ctx: ScoringContext): number {
    let score = 100;
    const integrityVulns = ctx.vulnerabilities.filter(v => v.category === "Tool Shadowing");
    for (const v of integrityVulns) score -= v.severity === "high" ? 25 : v.severity === "medium" ? 15 : 10;
    return Math.max(0, score);
}

function scorePolicyCompliance(ctx: ScoringContext): number {
    if (ctx.tools.length === 0) return 100;
    const toolIds = new Set(ctx.tools.map(t => t.id));
    const covered = new Set([...ctx.toolInvocationPolicies.filter(p => toolIds.has(p.toolId)).map(p => p.toolId), ...ctx.trustedDataPolicies.filter(p => toolIds.has(p.toolId)).map(p => p.toolId)]);
    return Math.round((covered.size / ctx.tools.length) * 100);
}

function generateRecommendations(ctx: ScoringContext, breakdown: TrustScoreResult["breakdown"]): string[] {
    const recs: string[] = [];
    if (ctx.vulnerabilities.some(v => v.category === "Lethal Trifecta")) recs.push("CRITICAL: Lethal Trifecta detected — apply 'block_when_context_is_untrusted'.");
    if (breakdown.toolDescriptionSafety < 70) recs.push("Review tool descriptions for prompt injection/hidden instructions.");
    if (breakdown.inputValidation < 70) recs.push("Add type constraints and validation to input schemas.");
    if (breakdown.permissionScope < 70) recs.push("Restrict tool access via least-privilege policies.");
    if (breakdown.dataHandling < 70) recs.push("Apply trusted data policies on sensitive tools.");
    if (breakdown.toolIntegrity < 80) recs.push("Resolve tool naming conflicts to prevent shadowing.");
    if (breakdown.policyCompliance < 50) recs.push("Configure Archestra security policies for all tools.");
    if (recs.length === 0) recs.push("Server is well-configured.");
    return recs;
}

export function calculateTrustScore(ctx: ScoringContext): TrustScoreResult {
    const breakdown = {
        toolDescriptionSafety: scoreToolDescriptionSafety(ctx),
        inputValidation: scoreInputValidation(ctx),
        permissionScope: scorePermissionScope(ctx),
        dataHandling: scoreDataHandling(ctx),
        toolIntegrity: scoreToolIntegrity(ctx),
        policyCompliance: scorePolicyCompliance(ctx),
    };

    let overallScore = Math.round(breakdown.toolDescriptionSafety * 0.25 + breakdown.inputValidation * 0.15 + breakdown.permissionScope * 0.2 + breakdown.dataHandling * 0.15 + breakdown.toolIntegrity * 0.1 + breakdown.policyCompliance * 0.15);
    if (ctx.vulnerabilities.some(v => v.severity === "critical")) overallScore = Math.min(overallScore, 40);

    return { serverName: ctx.tools[0]?.serverName ?? "unknown", overallScore, breakdown, grade: (s => s >= 95 ? "A+" : s >= 85 ? "A" : s >= 70 ? "B" : s >= 55 ? "C" : s >= 40 ? "D" : "F")(overallScore), recommendations: generateRecommendations(ctx, breakdown) };
}
