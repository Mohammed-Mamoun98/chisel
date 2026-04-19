# Chisel — Next.js app with Tailwind CSS and Biome

Chisel is a prompt engineering assistant that turns raw ideas into structured, agent-ready prompt sequences. It uses OpenRouter via the Vercel AI SDK for streaming LLM responses.

## Tooling & Build

- Use biome for linting and formatting, never eslint or prettier
- Use `pnpm` as the package manager
- Build with `pnpm build` before considering work done
- Run `pnpm lint` to check with biome (not eslint)
- Fix lint/format issues with `pnpm format`

## Project Structure

```
app/
  layout.tsx          — Root layout (dark theme, font-sans)
  page.tsx            — Main chat UI (client component)
  globals.css         — Tailwind v4 + @theme inline color tokens
  api/chat/route.ts   — POST endpoint using createAiServer
components/
  prompt-cards.tsx    — PromptSequence component + step parsing/rendering
lib/
  index.ts            — Server barrel (re-exports createAiServer, types)
  server.ts           — createAiServer: wraps OpenRouter + AI SDK streamText
  use-ai-chat.ts      — useAiChat: React hook wrapping useChat from ai/react
  types.ts            — Shared types: AiMessage, AiTool, AiServerConfig, AiChatState
```

### Import conventions

- Server code imports from `@/lib` (barrel re-exports `createAiServer`, `AiServer`, etc.)
- Client code imports from `@/lib/client` (barrel re-exports `useAiChat`, `AiChatState`, etc.)
- Components import from `@/components/<file>` (e.g. `@/components/prompt-cards`)

## Key Dependencies

- **Next.js 16** (App Router) with React 19
- **Vercel AI SDK** (`ai`, `ai/react`) — streaming text and chat hooks
- **OpenRouter provider** (`@openrouter/ai-sdk-provider`) — LLM routing
- **Zod** — tool parameter schemas in AiTool types
- **Tailwind CSS v4** with `@tailwindcss/postcss`

## Styling

- Tailwind CSS v4 with `@theme inline` block in `app/globals.css` for custom design tokens
- Dark theme by default; color tokens: `background`, `foreground`, `muted`, `surface`, `surface-hover`, `border`, `accent`, `accent-hover`
- Use these semantic tokens in class names (e.g. `bg-surface`, `text-muted`, `border-border`)
- Path alias `@/*` maps to project root

## Environment Variables

- `OPENROUTER_API_KEY` — Required. OpenRouter API key for LLM access.
- `AI_MODEL` — Optional. Defaults to `openai/gpt-oss-120b:free` if not set.

## Architecture

- **API route** (`app/api/chat/route.ts`): Creates an `AiServer` with a detailed system prompt for prompt engineering, then delegates request handling.
- **Server abstraction** (`lib/server.ts`): `createAiServer(config)` wraps `createOpenRouter` + `streamText` from the AI SDK. Returns `{ handleRequest }`.
- **Client hook** (`lib/use-ai-chat.ts`): `useAiChat({ endpoint })` wraps `useChat` from `ai/react`, normalizing message shape for the UI.
- **Component layer**: `PromptSequence` parses assistant responses into step cards with copy buttons and checkpoint dividers when the response contains ≥2 step-like lines.

## Validation Workflow

- After any code change, run `pnpm build` to verify the app compiles
- After build passes, run `pnpm lint` to verify linting/formatting
- If `pnpm lint` fails, run `pnpm format` then re-check
- Never consider a task done until both build and lint pass

## Change Strategy

- Make surgical, minimal edits — avoid touching unrelated files
- When editing a file, read it first to understand existing patterns and conventions
- Match existing code style (naming, imports, export patterns)
- React 19 + JSX transform (no explicit React imports needed)
- Biome is configured with 2-space indent, recommended rules, and import organization
- When adding new server utilities, export from `lib/index.ts`; for client hooks, export from `lib/client.ts`
- New components go in `components/` and are named with kebab-case filenames

## Error Prevention

- Do not add eslint or prettier configs or deps
- Do not create new AGENTS.md files in subdirectories unless there's a genuine scope difference
- Do not modify `biome.json` ignore patterns without updating the include/ignore lists together
- Do not add `any` types unless guarded by a biome-ignore comment with a justification
- Never commit `.env.local` or API keys to version control

## Commit Conventions

- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for all commit messages
- Scope is always required — format: `<type>(<scope>): <description>`
- Valid scopes: `app`, `ui`, `root` (use `root` for project-level changes)
- Examples: `feat(app): add landing page`, `fix(ui): resolve layout shift`, `chore(root): add biome config`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Use `!` after type for breaking changes (e.g. `feat(app)!: change route structure`)
- Include `BREAKING CHANGE:` in footer for breaking changes

## Commit Strategy

- Group changes into logical commits — not too big, not too small
- Each commit should represent one coherent concern
- Order commits by dependency: foundation changes first, dependents after
- Scope commits appropriately: `(app)`, `(ui)`, or `(root)`
- Every commit must leave the project in a buildable state (`pnpm build` must pass)
- Avoid mixing refactors, features, and docs in the same commit
