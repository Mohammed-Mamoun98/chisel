"use client";

import { PromptSequence } from "@/components/prompt-cards";
import { useAiChat } from "@/lib/client";

const EXAMPLE_PROMPTS = [
  "SaaS landing page with waitlist, blog, and analytics dashboard",
  "CLI tool that watches a folder and auto-resizes images on change",
  "Discord bot that summarizes long threads with a /summarize command",
  "Mobile app that tracks daily habits with streak visualization",
];

function Logo() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
      <span className="text-white font-bold text-xl">A</span>
    </div>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Send message"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function EmptyState({
  onExampleClick,
}: {
  onExampleClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <Logo />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Chisel
        </h1>
        <p className="text-muted text-base">
          Turn ideas into agent-ready prompt sequences
        </p>
      </div>

      <div className="w-full max-w-md space-y-3 mt-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wider text-center">
          Try an example
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onExampleClick(prompt)}
              className="text-left p-4 rounded-xl bg-surface border border-border hover:bg-surface-hover hover:border-accent/50 transition-all duration-200 group"
            >
              <p className="text-sm text-foreground/90 leading-snug group-hover:text-foreground">
                {prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerificationBlock({ questions }: { questions: string }) {
  const lines = questions
    .trim()
    .split("\n")
    .filter((l) => l.trim());

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted uppercase tracking-wide">
        Verification Questions
      </h4>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-foreground">
            {line.replace(/^-\s*/, "")}
          </p>
        ))}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Check for verification block
  const verificationMatch = content.match(
    /<verification>([\s\S]*?)<\/verification>/,
  );
  if (verificationMatch) {
    const before = content.slice(0, verificationMatch.index).trim();
    const after = content
      // biome-ignore lint/style/noNonNullAssertion: Match object guarantees index is defined
      .slice(verificationMatch.index! + verificationMatch[0].length)
      .trim();

    return (
      <div className="space-y-4">
        {before && <p className="text-sm">{before}</p>}
        <VerificationBlock questions={verificationMatch[1]} />
        {after && <p className="text-sm">{after}</p>}
      </div>
    );
  }

  // Check for prompt blocks - pass raw content with <prompt> tags to PromptSequence
  const hasPromptBlocks = /<prompt[^\u003e]*title="[^"]+"[^\u003e]*>/.test(
    content,
  );
  if (hasPromptBlocks) {
    return <PromptSequence text={content} />;
  }

  // Check for step-based content (fallback)
  const lines = content.split("\n");
  const stepCount = lines.filter((l) => /^\s*(Step|\d+\.)\s/i.test(l)).length;

  if (stepCount >= 2) {
    return <PromptSequence text={content} />;
  }

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
  );
}

export default function Home() {
  const { messages, input, setInput, handleSubmit, isLoading } = useAiChat({
    endpoint: "/api/chat",
  });

  const handleExampleClick = (text: string) => {
    setInput(text);
    // Small delay to ensure state update before submit
    setTimeout(() => {
      const form = document.getElementById("chat-form") as HTMLFormElement;
      if (form) {
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
    }, 10);
  };

  return (
    <div className="flex h-full flex-col bg-background relative">
      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Glow Orb */}
      <div className="fixed w-[500px] h-[500px] -top-[100px] right-[15%] z-0 pointer-events-none">
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)]" />
      </div>

      {messages.length === 0 ? (
        <EmptyState onExampleClick={handleExampleClick} />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((message, index) => {
            const msgId = `msg-${index}`;
            return (
              <div
                key={msgId}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-accent text-white"
                      : "bg-surface border border-border"
                  }`}
                >
                  <MessageContent content={message.content} />
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border p-4">
        <form
          id="chat-form"
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl"
        >
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your idea..."
              disabled={isLoading}
              className="w-full rounded-2xl border border-border bg-surface pl-4 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-muted mt-2">
            ↵ send · ↵+newline
          </p>
        </form>
      </div>
    </div>
  );
}
