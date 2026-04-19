# Chisel — Next.js app with Tailwind CSS and Biome

## Tooling & Build

- Use biome for linting and formatting, never eslint or prettier
- Use `pnpm` as the package manager
- Build with `pnpm build` before considering work done
- Run `pnpm lint` to check with biome (not eslint)
- Fix lint/format issues with `pnpm format`

## Project Structure

- Single Next.js app (App Router) — `app/` directory
- Path alias: `@/*` maps to project root (see `tsconfig.json`)
- Styling: Tailwind CSS v4 with `@tailwindcss/postcss`
- Use TypeScript strict mode

## Validation Workflow

- After any code change, run `pnpm build` to verify the app compiles
- After build passes, run `pnpm lint` to verify linting/formatting
- If `pnpm lint` fails, run `pnpm format` then re-check
- Never consider a task done until both build and check pass

## Change Strategy

- Make surgical, minimal edits — avoid touching unrelated files
- When editing a file, read it first to understand existing patterns and conventions
- Match existing code style (naming, imports, export patterns)
- React 19 + JSX transform (no explicit React imports needed)
- Biome is configured with 2-space indent, recommended rules, and import organization

## Error Prevention

- Do not add eslint or prettier configs or deps
- Do not create new AGENTS.md files in subdirectories unless there's a genuine scope difference
- Do not modify `biome.json` ignore patterns without updating the include/ignore lists together
- Do not add `any` types unless guarded by a biome-ignore comment with a justification

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
