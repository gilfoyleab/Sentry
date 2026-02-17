import { zodToJsonSchema } from "zod-to-json-schema";
import { GenerateTrustBadgeInput } from "../lib/inputs.js";
import type { TrustBadgeResult } from "../lib/outputs.js";
import { trustScore } from "./trust-score.js";
import { log, LogLevel } from "../lib/logger.js";

export async function generateTrustBadge(args: unknown): Promise<TrustBadgeResult> {
    const { serverName } = GenerateTrustBadgeInput.parse(args);
    log(LogLevel.INFO, `Generating trust badge for server: ${serverName}`);

    const result = await trustScore({ serverName });
    const score = result.overallScore;
    const grade = result.grade;

    // Modern HSL color mapping
    const colors: Record<string, string> = {
        "A+": "#10b981", // Emerald
        "A": "#059669", // Green
        "B": "#3b82f6", // Blue
        "C": "#f59e0b", // Amber
        "D": "#f97316", // Orange
        "F": "#ef4444", // Red
    };

    const color = colors[grade] || "#6b7280";

    const svg = `
<svg width="200" height="40" viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="40" rx="8" fill="#1f2937"/>
  <rect x="0" y="0" width="120" height="40" rx="8" fill="#374151"/>
  <rect x="110" y="0" width="10" height="40" fill="#374151"/>
  <text x="15" y="25" font-family="Inter, sans-serif" font-weight="bold" font-size="14" fill="#f3f4f6">SENTRY TRUST</text>
  <rect x="120" y="0" width="80" height="40" rx="8" fill="${color}"/>
  <rect x="120" y="0" width="10" height="40" fill="${color}"/>
  <text x="160" y="26" text-anchor="middle" font-family="Inter, sans-serif" font-weight="extrabold" font-size="20" fill="white">${grade}</text>
</svg>
  `.trim();

    return {
        serverName,
        trustScore: score,
        grade,
        svg,
    };
}

export const generateTrustBadgeTool = {
    name: "generate_trust_badge",
    description: "Generate a visual SVG trust badge for a server.",
    inputSchema: zodToJsonSchema(GenerateTrustBadgeInput),
    handler: generateTrustBadge,
};
