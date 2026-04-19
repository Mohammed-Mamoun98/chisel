import type { z } from "zod";

// ─── Shared ───

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiTool<Args = Record<string, unknown>, Result = unknown> {
  description?: string;
  parameters: z.ZodType<Args>;
  // biome-ignore lint/suspicious/noExplicitAny: accepts AI SDK ToolExecutionOptions or any caller context
  execute: (args: Args, ...rest: any[]) => PromiseLike<Result> | Result;
}

// ─── Server-side (createAiServer) ───

export interface AiServerConfig {
  apiKey: string;
  model?: string;
  maxSteps?: number;
  systemPrompt: string;
  // biome-ignore lint/suspicious/noExplicitAny: tool args/results are schema-typed at runtime via zod
  tools?: Record<string, AiTool<any, any>>;
}

export interface AiServer {
  handleRequest: (req: Request) => Promise<Response>;
}

// ─── Client-side (useAiChat) ───

export interface AiChatConfig {
  endpoint: string;
}

export interface AiChatState {
  messages: AiMessage[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isWaiting: boolean;
}
