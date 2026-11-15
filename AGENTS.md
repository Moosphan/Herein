# Development workspace

Use the primary checkout at `/Users/dorck/self-projects/MyDashboard` on `main` for subsequent development, unless the user requests another branch or worktree.

# Design contract

For feature iterations or substantial bugs, use the installed `to-tickets` skill and follow `docs/agents/issue-tracker.md` for GitHub issue numbering, parent/child relationships, dependencies, and progress. Small fixes use the exception defined there.

Before creating or changing any UI design, renderer component, page, style, theme, icon, typography, or interaction, read `docs/design-system/spec-v2.md` and the relevant entries in `docs/design-system/page-specs-v2.md`. Design specification 2.0 is authoritative; historical v1/v3 documents and HTML previews are reference only.

Use HeroUI 3.2.6 public components with the existing MyDashboard theme. Preserve existing desktop layouts, including each item's information order, alignment, width, density, and action placement; follow the item contracts in `page-specs-v2.md`. Use HeroUI built-in icons first and Heroicons 2.2.0 outline icons only for missing business symbols. For uncertain business rules or layout changes, collect evidence and ask the user before adopting them; follow `docs/design-system/interaction-audit-v2.md`. Record exceptions and migration progress in `docs/design-system/migration.md`. Validate design assets with `pnpm design:check` and `pnpm design:build`; UI implementation also requires the affected-page, keyboard, theme, and Electron checks defined in the specification.
