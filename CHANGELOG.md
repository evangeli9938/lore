# Changelog

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
