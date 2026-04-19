"use client";

import { useChat } from "ai/react";
import type { AiChatConfig, AiChatState } from "./types";

export function useAiChat(config: AiChatConfig): AiChatState {
  const chat = useChat({
    api: config.endpoint,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    chat.handleSubmit(e);
  };

  return {
    messages: (chat.messages ?? []).map(
      (m: { role: string; content: string | string[] }) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : "",
      }),
    ),
    input: chat.input ?? "",
    setInput: chat.setInput,
    handleSubmit,
    isLoading: chat.isLoading,
    isWaiting: chat.isLoading,
  };
}
