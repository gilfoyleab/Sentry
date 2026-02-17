import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { ArchestraClient } from "../lib/client.js";

const chatInput = z.object({
    message: z.string().describe("The message or security question for Sentry.")
});

const client = new ArchestraClient();

export async function chatWithSentry(args: unknown) {
    const { message } = chatInput.parse(args);
    const prompt = `You are Sentry Pro, an advanced security auditor. Answer this security query: ${message}`;
    const response = await client.chatCompletion(prompt);

    return {
        response,
        status: "success",
        engine: "Groq Llama-3.3-70b"
    };
}

export const chatWithSentryTool = {
    name: "chat_with_sentry",
    description: "Direct AI communication with Sentry Pro. Use this to ask security questions if the platform chat is unavailable.",
    inputSchema: zodToJsonSchema(chatInput),
    handler: chatWithSentry,
};
