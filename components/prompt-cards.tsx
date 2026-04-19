"use client";

import { useState } from "react";

interface StepCard {
  title: string;
  content: string;
  hasCheckpoint: boolean;
  checkpointText?: string;
  hasSubAgents: boolean;
  subAgentLines: string[];
}

interface ParsedPrompt {
  cards: StepCard[];
  checkpoints: Map<number, string>;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
// Handles: **bold**, *italic*, `inline code`, ```code blocks```, - list items
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const output: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === "") {
      output.push(<div key={`gap-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      output.push(
        <pre
          key={`code-${i}`}
          className="my-2 p-3 rounded-md bg-black/40 border border-border overflow-x-auto text-xs text-foreground/80 font-mono"
        >
          {lang && (
            <span className="block text-accent/50 text-[10px] mb-1 uppercase tracking-wider">
              {lang}
            </span>
          )}
          {codeLines.join("\n")}
        </pre>,
      );
      continue;
    }

    // Docs injection header line
    if (/^Before writing any code/i.test(trimmed)) {
      output.push(
        <p key={`docs-${i}`} className="text-muted italic mt-3 mb-1 text-xs">
          {trimmed}
        </p>,
      );
      i++;
      continue;
    }

    // → arrow lines (docs URLs or sub-agent descriptions)
    if (/^→\s/.test(trimmed)) {
      if (/https?:\/\//.test(trimmed)) {
        // Doc URL line: → Tech: https://...
        const withoutArrow = trimmed.replace(/^→\s*/, "");
        const colonIdx = withoutArrow.search(/:\s*https?:\/\//);
        const tech =
          colonIdx >= 0 ? withoutArrow.slice(0, colonIdx) : withoutArrow;
        const url =
          colonIdx >= 0 ? withoutArrow.slice(colonIdx + 1).trim() : "";
        output.push(
          <p
            key={`doc-url-${i}`}
            className="pl-3 ml-1 py-0.5 border-l-2 border-border text-xs"
          >
            <span className="text-foreground/80">{tech}: </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent/70 hover:text-accent transition-colors underline underline-offset-2"
            >
              {url}
            </a>
          </p>,
        );
      } else {
        // Plain arrow line (non-URL)
        output.push(
          <p
            key={`arrow-${i}`}
            className="pl-3 ml-1 py-0.5 border-l-2 border-accent/40 text-sm text-foreground/80"
          >
            {inlineMarkdown(trimmed.replace(/^→\s*/, ""))}
          </p>,
        );
      }
      i++;
      continue;
    }

    // List item: - or *
    if (/^[-*]\s/.test(trimmed)) {
      output.push(
        <p
          key={`li-${i}`}
          className="pl-3 text-sm text-foreground/85 leading-relaxed flex gap-2"
        >
          <span className="text-accent/60 mt-1 shrink-0">–</span>
          <span>{inlineMarkdown(trimmed.replace(/^[-*]\s/, ""))}</span>
        </p>,
      );
      i++;
      continue;
    }

    // Default paragraph
    output.push(
      <p key={`p-${i}`} className="text-sm text-foreground/85 leading-relaxed">
        {inlineMarkdown(trimmed)}
      </p>,
    );
    i++;
  }

  return output;
}

// Inline markdown: **bold**, *italic*, `code`
function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-foreground/70">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-black/40 text-accent/90 font-mono text-xs border border-border/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseSteps(text: string): ParsedPrompt | null {
  const promptRegex = /<prompt title="([^"]+)">([\s\S]*?)<\/prompt>/g;
  const checkpointRegex = /──\s*⏸[^─]*──/g;

  const cards: StepCard[] = [];
  const checkpoints = new Map<number, string>();

  const matches = Array.from(text.matchAll(promptRegex));
  if (matches.length === 0) return null;

  const checkpointMatches = Array.from(text.matchAll(checkpointRegex));

  for (const match of matches) {
    const title = match[1].trim();
    const rawContent = match[2];

    // Detect sub-agent lines: lines starting with → Sub-agent
    // These are pulled out and rendered separately in SubAgentBlock
    const lines = rawContent.split("\n");
    const subAgentLines: string[] = [];
    const contentLines: string[] = [];
    let inSubAgentBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();
      // "Spawn sub-agents" header line — start collecting
      if (/^Spawn sub-agents/i.test(trimmed)) {
        inSubAgentBlock = true;
        continue; // don't include the header in content
      }
      // Arrow lines inside sub-agent block
      if (inSubAgentBlock && /^→/.test(trimmed)) {
        subAgentLines.push(line);
        continue;
      }
      // "These tasks are independent" closing line
      if (inSubAgentBlock && /^These tasks are independent/i.test(trimmed)) {
        inSubAgentBlock = false;
        continue;
      }
      // End sub-agent block on empty line after collecting agents
      if (inSubAgentBlock && trimmed === "" && subAgentLines.length > 0) {
        inSubAgentBlock = false;
      }
      contentLines.push(line);
    }

    cards.push({
      title: title || `Step ${cards.length + 1}`,
      content: contentLines.join("\n").trim(),
      hasCheckpoint: false,
      hasSubAgents: subAgentLines.length > 0,
      subAgentLines,
    });
  }

  // Map checkpoints to card gaps
  for (let i = 0; i < cards.length; i++) {
    const cardEnd = (matches[i].index ?? 0) + matches[i][0].length;
    const nextCardStart =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? text.length)
        : text.length;

    for (const cpMatch of checkpointMatches) {
      const cpIndex = cpMatch.index ?? 0;
      if (cpIndex >= cardEnd && cpIndex < nextCardStart) {
        checkpoints.set(i, cpMatch[0].trim());
        cards[i].hasCheckpoint = true;
        cards[i].checkpointText = cpMatch[0].trim();
        break;
      }
    }
  }

  return { cards, checkpoints };
}

// ─── Sub-agent block ──────────────────────────────────────────────────────────
function SubAgentBlock({ lines }: { lines: string[] }) {
  const subAgents = lines
    .filter((l) => /^→/.test(l.trim()))
    .map((l) => l.trim().replace(/^→\s?/, ""));

  if (subAgents.length === 0) return null;

  return (
    <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-accent shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-label="Sub-agents"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="text-sm font-medium text-accent">
          Spawn sub-agents in parallel
        </span>
      </div>
      <div className="space-y-2">
        {subAgents.map((agent, i) => (
          <div
            key={`agent-${i}-${agent.slice(0, 15)}`}
            className="flex items-start gap-2 text-sm text-foreground/80 pl-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-1.5 shrink-0" />
            <span className="font-mono text-xs text-foreground/90 leading-relaxed">
              {inlineMarkdown(agent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-foreground hover:border-muted transition-colors cursor-pointer shrink-0"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function PromptSequence({ text }: { text: string }) {
  const parsed = parseSteps(text);
  if (!parsed || parsed.cards.length === 0) {
    return <pre className="whitespace-pre-wrap text-sm">{text}</pre>;
  }

  const { cards, checkpoints } = parsed;

  const parts: string[] = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    let cardText = `<prompt title="${card.title}">\n${card.content}`;
    if (card.hasSubAgents) {
      cardText += `\n\nSpawn sub-agents to work simultaneously:\n${card.subAgentLines.join("\n")}\nThese tasks are independent. Do not wait for one to finish before starting another. Merge results once all complete.`;
    }
    cardText += `\n</prompt>`;
    if (checkpoints.has(i)) cardText += `\n${checkpoints.get(i)}`;
    parts.push(cardText);
  }
  const fullSequence = parts.join("\n\n");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">
          Prompt Sequence
        </span>
        <CopyButton text={fullSequence} label="Copy All" />
      </div>

      {cards.map((card, idx) => (
        <div key={`card-${idx}-${card.title.slice(0, 15)}`}>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-sm font-semibold text-accent leading-snug">
                {card.title}
              </h4>
              <CopyButton
                text={`<prompt title="${card.title}">\n${card.content}${card.hasSubAgents ? `\n\nSpawn sub-agents to work simultaneously:\n${card.subAgentLines.join("\n")}\nThese tasks are independent. Do not wait for one to finish before starting another. Merge results once all complete.` : ""}\n</prompt>`}
                label="Copy"
              />
            </div>
            <div className="space-y-1">{renderMarkdown(card.content)}</div>
            {card.hasSubAgents && <SubAgentBlock lines={card.subAgentLines} />}
          </div>

          {checkpoints.has(idx) && (
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted whitespace-nowrap px-2">
                {checkpoints.get(idx)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
