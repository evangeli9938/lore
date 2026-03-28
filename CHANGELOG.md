# Changelog

## [1.2.1] - 2026-03-28

### Added

- npm packaging metadata for the global CLI package `codex-lore`.

### Changed

- Renamed the npm package from `lore` to `codex-lore` so it can be published without colliding with the existing `lore` package on npm.
- Added a global `lore` binary via the package `bin` field so users can run `npm install -g codex-lore` and then invoke `lore` directly.
- Added npm publish metadata (`description`, `license`, `repository`, `bugs`, `author`, `engines`, and `files`) and updated the README install instructions for the global CLI flow.

## [1.2.0] - 2026-03-28

### Added

- New end-to-end coverage for Lore hook lifecycle behavior, including SessionStart injection, whisper no-op behavior without `session_id`, and cross-project sharing of a promoted Python rule across two separate Python projects.
- New scorer and whisper-selection tests covering recent tool-name context and high-confidence session nudges.

### Changed

- **Whisper scoring** now incorporates `recentToolNames` as a first-class session signal, so recent tool usage such as `npm`, `vitest`, `psql`, and `docker` can influence turn relevance.
- **Pre-prompt whisper selection** now keeps shared knowledge as the primary channel while allowing light, high-confidence session nudges only when session context is strong or the prompt is otherwise underspecified.
- Updated README delivery-layer and whisper behavior language to match the current runtime behavior and test counts.

### Removed

- Removed no-longer-needed local assets `assets/lore-icon.svg`, `assets/lore-logo.svg`, and `.codex-echo/`.

## [1.1.0] - 2026-03-28

### Added

- **Capability-aware SessionStart instruction template** (`src/plugin/session-start-template.ts`) — composable section renderers that inject Lore behavior guidance into the agent's context. Tool-specific sections (recall, promote, demote, CLI fallback) are gated behind explicit `LoreCapabilities` flags so the agent never sees references to unavailable tools.
- New types: `LoreCapabilities`, `SelectedEntry`, `ContextBuilderResult`, `SessionStartTemplateInput` in `src/shared/types.ts`.
- 26 new tests for the template module covering all capability tiers (none, recall-only, CLI-only, full), section ordering, kind grouping, and the null-for-empty invariant.

### Changed

- **context-builder.ts** now returns data (`ContextBuilderResult` with `selectedEntries: SelectedEntry[]`) instead of rendered markdown. Scoring, selection, dedup, per-kind caps, and token budget logic are unchanged.
- **session-start.ts** wires the new template module and resolves baseline capabilities (all false until MCP tools are wired in a future release).
- Updated existing tests in `context-builder.test.ts` and `session-start.test.ts` for the new data return type.
- Updated README test counts (279 -> 309, 24 -> 25 test files) and project structure description.
- Updated `docs/design.md` and `CLAUDE.md` plugin layer descriptions to mention the instruction template.

### Removed

- Removed inline `FULL_INJECTION_TEMPLATE` and `formatSessionKnowledgeEntries` from `context-builder.ts` (moved to template module).
- Removed dead links to gitignored design documents from README.md, docs/design.md, and CLAUDE.md.

## [1.0.0] - 2026-03-28

Initial release. Two-tier memory (project-scoped + shared cross-project knowledge) with four delivery layers: SessionStart injection, pre-prompt whispers, MCP recall tools, and advisory hints.
