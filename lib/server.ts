import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { type CoreMessage, streamText } from "ai";
import type { AiServerConfig } from "./types";

const DEFAULT_MODEL = "openai/gpt-oss-120b:free";

export function createAiServer(config: AiServerConfig) {
  const openrouter = createOpenRouter({
    apiKey: config.apiKey,
  });

  const model = config.model ?? DEFAULT_MODEL;
  const maxSteps = config.maxSteps ?? 5;

  return {
    async handleRequest(req: Request) {
      const body: { messages?: CoreMessage[] } = await req.json();
      const messages = body.messages ?? [];

      const result = streamText({
        model: openrouter(model),
        system: config.systemPrompt,
        messages,
        tools: config.tools,
        maxSteps,
      });

      return result.toDataStreamResponse();
    },
  };
}
