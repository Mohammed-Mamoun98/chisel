# Project Rules

## Tooling & Build

- Use biome for linting and formatting, never eslint or prettier
- Use `pnpm` as the package manager
- Build with `pnpm build` before considering work done
- Run `pnpm lint` before committing to catch lint/format issues
- Fix lint/format issues with `pnpm format` (biome format --write .)

## Exports & Package Boundaries

- SDK server code from `@zap-tools/sdk`, client code from `@zap-tools/sdk/client`
- UI components live in `@zap-tools/ui`
- Prefer the AI SDK `tool()` helper for defining tools with zod schemas
- Use TypeScript strict mode across all packages

## Monorepo Structure

- Monorepo managed with pnpm workspaces + Turborepo
- `packages/sdk` — `@zap-tools/sdk` (server + client entry points)
- `packages/ui` — `@zap-tools/ui` (React components: ZapWidget, ZapProvider, useZap)
- `apps/example` — Next.js demo app
- SDK exports: `src/index.ts` (server), `src/client-entry.ts` (client hook + types)
- UI exports: `src/index.ts` re-exports from context, widget, and SDK client types

## Key Source Files

- `packages/sdk/src/server.ts` — createZapServer (main server entry)
- `packages/sdk/src/types.ts` — all shared interfaces (ZapMessage, ZapTool, ZapServerConfig, etc.)
- `packages/sdk/src/use-zap-chat.ts` — useZapChat hook (client-side)
- `packages/sdk/src/client-entry.ts` — client barrel export
- `packages/ui/src/widget.tsx` — ZapWidget component
- `packages/ui/src/chat-panel.tsx` — ChatPanel component
- `packages/ui/src/message.tsx` — Message component
- `packages/ui/src/context.tsx` — ZapProvider + useZap context

# Codex Efficiency Practices

## Validation Workflow

- After any code change, run `pnpm build` to verify the monorepo compiles
- After build passes, run `pnpm lint` to verify linting/formatting
- If `pnpm lint` fails, run `pnpm format` then re-check
- Never consider a task done until both build and check pass

## Change Strategy

- Make surgical, minimal edits — avoid touching unrelated files
- When editing a file, read it first to understand existing patterns and conventions
- Match existing code style (naming, imports, export patterns) in each package
- Keep the SDK boundary strict: server code must not import client-only modules and vice versa
- When adding new exports, update the barrel file (index.ts or client-entry.ts) as well

## Monorepo Awareness

- Changes to `packages/sdk` may require rebuilding `packages/ui` and `apps/example`
- Always build from the root (`pnpm build`) to respect Turborepo's dependency graph
- Workspace dependencies use `workspace:*` — never hardcode local package versions
- Path aliases are defined in root `tsconfig.json`: `@zap-tools/sdk`, `@zap-tools/sdk/client`, `@zap-tools/ui`

## Common Patterns

- Tool definitions use `ZapTool<Args, Result>` interface with zod schemas
- Components use React 19 + JSX transform (no explicit React imports needed)
- Biome is configured with 2-space indent, recommended rules, and import organization
- The `biome-ignore` comments in types.ts are intentional — do not remove them

## Error Prevention

- Do not add eslint or prettier configs or deps
- Do not create new AGENTS.md files in subdirectories unless there's a genuine scope difference
- Do not modify `biome.json` ignore patterns without updating the include/ignore lists together
- Do not add `any` types unless guarded by a biome-ignore comment with a justification

## Commit Conventions

- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for all commit messages
- Scope is always required — format: `<type>(<scope>): <description>`
- Valid scopes: `sdk`, `ui`, `example`, `root` (use `root` for cross-cutting or project-level changes)
- Examples: `feat(sdk): add streaming support`, `fix(ui): resolve chat panel scroll issue`, `chore(root): add biome config`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Use `!` after type for breaking changes (e.g. `feat(sdk)!: change server config API`)
- Include `BREAKING CHANGE:` in footer for breaking changes

## Commit Strategy

- Group changes into logical commits — not too big, not too small
- Each commit should represent one coherent concern (e.g. SDK refactor, UI adaptation, example app, docs)
- Order commits by dependency: foundation changes first, dependents after
- Scope commits to package boundaries when possible: `(sdk)`, `(ui)`, `(example)`, or root
- Every commit must leave the project in a buildable state (`pnpm build` must pass)
- Avoid mixing refactors, features, and docs in the same commit
- Typical commit flow for cross-cutting changes: core package → dependent packages → apps → docs
