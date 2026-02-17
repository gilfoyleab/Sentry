import { z } from "zod";

export const VulnerabilitySchema = z.object({
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    category: z.string(),
    tool: z.string(),
    description: z.string(),
    recommendation: z.string(),
});

export type Vulnerability = z.infer<typeof VulnerabilitySchema>;

export const ScanResultSchema = z.object({
    serverName: z.string(),
    toolCount: z.number(),
    vulnerabilities: z.array(VulnerabilitySchema),
    trustScore: z.number().min(0).max(100),
    scannedAt: z.string(),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

export const TestResultSchema = z.object({
    serverName: z.string(),
    totalTests: z.number(),
    passed: z.number(),
    failed: z.number(),
    errors: z.number(),
    results: z.array(
        z.object({
            tool: z.string(),
            testType: z.string(),
            input: z.any(),
            expectedBehavior: z.string(),
            actualResult: z.string(),
            status: z.enum(["pass", "fail", "error"]),
            issue: z.string().optional(),
        }),
    ),
});

export type TestResult = z.infer<typeof TestResultSchema>;

export const PolicyResultSchema = z.object({
    serverName: z.string(),
    policiesGenerated: z.number(),
    policies: z.array(
        z.object({
            type: z.enum(["tool_invocation", "trusted_data"]),
            toolName: z.string(),
            action: z.string(),
            reason: z.string(),
            applied: z.boolean(),
        }),
    ),
});

export type PolicyResult = z.infer<typeof PolicyResultSchema>;

export const TrustScoreResultSchema = z.object({
    serverName: z.string(),
    overallScore: z.number().min(0).max(100),
    breakdown: z.object({
        toolDescriptionSafety: z.number().min(0).max(100),
        inputValidation: z.number().min(0).max(100),
        permissionScope: z.number().min(0).max(100),
        dataHandling: z.number().min(0).max(100),
        toolIntegrity: z.number().min(0).max(100),
        policyCompliance: z.number().min(0).max(100),
    }),
    grade: z.enum(["A+", "A", "B", "C", "D", "F"]),
    recommendations: z.array(z.string()),
});

export type TrustScoreResult = z.infer<typeof TrustScoreResultSchema>;

export const AlertSchema = z.object({
    type: z.enum([
        "high_error_rate",
        "unusual_volume",
        "suspicious_input",
        "policy_violation",
    ]),
    severity: z.enum(["critical", "warning", "info"]),
    description: z.string(),
    timestamp: z.string(),
});

export const MonitorResultSchema = z.object({
    timeRange: z.string(),
    servers: z.array(
        z.object({
            serverName: z.string(),
            totalCalls: z.number(),
            errorCount: z.number(),
            errorRate: z.number(),
            topTools: z.array(
                z.object({
                    name: z.string(),
                    calls: z.number(),
                }),
            ),
            alerts: z.array(AlertSchema),
        }),
    ),
});

export type MonitorResult = z.infer<typeof MonitorResultSchema>;

export const BenchmarkServerSchema = z.object({
    serverName: z.string(),
    trustScore: z.number().min(0).max(100),
    grade: z.enum(["A+", "A", "B", "C", "D", "F"]),
    vulnerabilityCount: z.number().int().nonnegative(),
    criticalCount: z.number().int().nonnegative(),
    highCount: z.number().int().nonnegative(),
    riskIndex: z.number().int().nonnegative(),
});

export const BenchmarkResultSchema = z.object({
    generatedAt: z.string(),
    totalAnalyzed: z.number().int().nonnegative(),
    ranked: z.array(BenchmarkServerSchema),
    failed: z.array(
        z.object({
            serverName: z.string(),
            error: z.string(),
        }),
    ),
});

export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;

export const AuditReportResultSchema = z.object({
    generatedAt: z.string(),
    summary: z.object({
        totalServers: z.number(),
        totalTools: z.number(),
        totalVulnerabilities: z.number(),
        criticalCount: z.number(),
        highCount: z.number(),
        mediumCount: z.number(),
        lowCount: z.number(),
        averageTrustScore: z.number(),
        policiesConfigured: z.number(),
        policiesMissing: z.number(),
    }),
    report: z.string(),
});

export type AuditReportResult = z.infer<typeof AuditReportResultSchema>;

export const TrustOpsRunResultSchema = z.object({
    generatedAt: z.string(),
    scope: z.object({
        totalServers: z.number().int().nonnegative(),
        evaluatedServers: z.number().int().nonnegative(),
        riskyServers: z.number().int().nonnegative(),
    }),
    benchmark: z.object({
        topN: z.number().int().positive(),
        ranked: z.array(BenchmarkServerSchema),
    }),
    hardening: z.object({
        attempted: z.number().int().nonnegative(),
        succeeded: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
    }),
    monitoring: z.object({
        lookbackMinutes: z.number().int().positive(),
        serversWithAlerts: z.number().int().nonnegative(),
        criticalAlerts: z.number().int().nonnegative(),
    }),
    audit: z.object({
        included: z.boolean(),
        format: z.enum(["markdown", "json"]),
        report: z.string().optional(),
    }),
    recommendations: z.array(z.string()),
});

export type TrustOpsRunResult = z.infer<typeof TrustOpsRunResultSchema>;

export const RedTeamResultSchema = z.object({
    serverName: z.string(),
    payloadsGenerated: z.number(),
    attacks: z.array(z.object({
        tool: z.string(),
        attackType: z.string(),
        payload: z.string(),
        simulatedOutcome: z.string(),
        riskLevel: z.enum(["critical", "high", "medium", "low"]),
    })),
});

export type RedTeamResult = z.infer<typeof RedTeamResultSchema>;

export const DataFlowResultSchema = z.object({
    serverName: z.string(),
    mermaidDiagram: z.string(),
    riskChains: z.array(z.string()),
});

export type DataFlowResult = z.infer<typeof DataFlowResultSchema>;

export const TrustBadgeResultSchema = z.object({
    serverName: z.string(),
    trustScore: z.number(),
    grade: z.string(),
    svg: z.string(),
});

export type TrustBadgeResult = z.infer<typeof TrustBadgeResultSchema>;
