import { zodToJsonSchema } from "zod-to-json-schema";
import { TestServerInput } from "../lib/inputs.js";
import type { TestResult } from "../lib/outputs.js";
import { ArchestraClient } from "../lib/client.js";
import { log, LogLevel } from "../lib/logger.js";
import { generateTestCases } from "../lib/test-generator.js";

const client = new ArchestraClient();

export async function testServer(args: unknown): Promise<TestResult> {
  const { serverName, testTypes } = TestServerInput.parse(args);
  log(LogLevel.INFO, `Testing server: ${serverName}`, { testTypes });

  const serverId = await client.resolveServerName(serverName);
  let tools = (await client.getServerTools(serverId)).map((t) => ({ ...t, serverName }));

  const allTestCases = tools.flatMap((tool) => generateTestCases(tool, testTypes));
  const results: TestResult["results"] = [];
  let passed = 0, failed = 0, errors = 0;

  for (const tc of allTestCases) {
    try {
      const prompt = `Analyze tool "${tc.tool}". Input: ${JSON.stringify(tc.input)}. Expected: ${tc.expectedBehavior}. Reply with JSON {"status": "pass"|"fail"|"error", "result": "...", "issue": "..."}`;
      const content = await client.chatCompletion(prompt);
      let analysis: any;
      try { analysis = JSON.parse(content); } catch { analysis = { status: "error", result: "Failed to parse" }; }

      results.push({ tool: tc.tool, testType: tc.testType, input: tc.input, expectedBehavior: tc.expectedBehavior, actualResult: analysis.result, status: analysis.status, issue: analysis.issue });
      if (analysis.status === "pass") passed++;
      else if (analysis.status === "fail") failed++;
      else errors++;
    } catch (error) {
      errors++;
      results.push({ tool: tc.tool, testType: tc.testType, input: tc.input, expectedBehavior: tc.expectedBehavior, actualResult: `Error: ${error instanceof Error ? error.message : String(error)}`, status: "error", issue: "Test failed" });
    }
  }
  return { serverName, totalTests: allTestCases.length, passed, failed, errors, results };
}

export const testServerTool = {
  name: "test_server",
  description: "Generate and run security test cases.",
  inputSchema: zodToJsonSchema(TestServerInput),
  handler: testServer,
};
