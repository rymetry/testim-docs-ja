# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Japanese localization of Testim Help Documentation (docs.tricentis.com/testim). Built with Astro 6, Tailwind CSS v4, TypeScript, and React (for search UI only). Deployed on Vercel. All responses and content should be in Japanese.

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build (runs `astro check` + build) |
| `npm run check` | TypeScript/Astro type checking only |
| `npm run lint` | All lint (`lint:md` + `lint:docs`) |
| `npm run lint:docs` | WRITING_GUIDE compliance (frontmatter, links, callouts, feature names, image existence) |
| `npm run lint:fix` | Auto-fix markdown lint issues |
| `npm run format` | Format with Prettier (Astro, TS, MD) |
| `npm run test` | Run tests in `scripts/__tests__/` |
| `npm run check:parity` | Source parity check (structure, tables, acknowledgements, EN normalization) |
| `npm run check:snapshots` | EN HTML snapshot fetch + diff (change detection) |
| `npm run check:snapshots:fetch` | Fetch EN HTML snapshots only |
| `npm run check:snapshots:diff` | Diff committed vs working tree snapshots only |
| `npm run docs:sync-sidebar` | Update SIDEBAR_URLS.md from MadCap Flare TOC data |
| `npm run docs:pipeline` | Run full doc sync pipeline (fetch, translate, etc.) |

**Single-page commands:**

```bash
npm run check:parity -- --slug=overview/testim-overview
npm run check:snapshots:diff -- --slug=overview/testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md
```

Full reference: `scripts/README.md`

## Architecture

- **Content**: Markdown files in `src/content/docs/` organized by category folders. Schema defined in `src/content.config.ts` (Zod validation).
- **Routing**: Single dynamic route `src/pages/docs/[...slug].astro` — slug is the path relative to `src/content/docs/` (e.g., `overview/testim-overview.md` → `/docs/overview/testim-overview`). Legacy basename URLs are redirected via `buildRedirectMap()` in `astro.config.mjs`.
- **Navigation**: Built from `src/lib/docs.ts` `buildNavigation()` — groups by `category` frontmatter, ordered by `docs/SIDEBAR_URLS.md`.
- **Search**: Client-side MiniSearch in `src/components/SearchModal.tsx` (React), with data from `/api/search.json`.
- **Layout**: `src/layouts/DocsLayout.astro` wraps all doc pages with sidebar (`src/components/navigation/NavSidebar.astro`) and TOC (`TableOfContents.astro`).
- **Auth mode**: `BASIC_AUTH_ENABLED` env var toggles between SSR+auth (review) and static (production). See `src/middleware.ts`.
- **Doc pipeline**: `scripts/pipeline.mjs` orchestrates the full translation workflow: fetch EN sources → generate placeholders (`generate_untranslated_placeholders.mjs`) → prepare LLM tasks (`prepare_llm_tasks.mjs`) → apply LLM translations (`apply_llm_translations.mjs`). Checkpoint-based resume via `scripts/.checkpoint`.
- **Snapshot pipeline**:
  - **Content**: Extracts `#mc-main-content` from each EN page HTML, saves to `snapshots/en/content/{folder}/{basename}.html`.
  - **Sidebar**: Parses MadCap Flare TOC data (`scripts/lib/madcap_toc.mjs`), saves to `snapshots/en/sidebar.json`.
  - **Parity comparison**: Converts HTML snapshots to Markdown via `turndown`, then compares structure with JA translations.
  - **Source-side debt**: broken upstream EN ソースは `scripts/lib/source_sync_exclusions.mjs` の registry で隔離し、snapshot 上書きを抑止して `source-sync-status.json` の `excludedPages` counter で可視化する (詳細は `docs/DOCS_DATE_TRACKING.md`)。

## Authority Sources

- **`docs/SYSTEM_SPEC.md`** — Project specification summary: architecture, detection system, invariants, document index.
- **`docs/WRITING_GUIDE.md`** — Authoritative rules for content formatting, frontmatter, links, callouts, source-first structure contract (heading mapping, `:fa-arrow-right:` handling, `<details>` preservation, JA-only section removal), Testim terminology English retention.
- **`docs/TRANSLATION_GUIDE.md`** — Translation workflow, natural Japanese guidelines, NG/OK patterns, terminology table.
- **`docs/OPS_DESIGN.md`** — Operational design: sync/diff/translate/QA flow, review policy, feedback loop, review checklists.
- **`docs/PARITY_GUIDE.md`** — Parity maintenance: 2-mechanism suppression design, gate matrix, parallel agent delegation.
- **`docs/DOCS_DATE_TRACKING.md`** — Snapshot-based change detection: HTML snapshot format, sidebar JSON structure, diff classification, CI workflow, and translation sync process.
- **`docs/SIDEBAR_URLS.md`** — Master list of all documentation URLs, categories, and page ordering. Single source of truth for what pages exist and their structure.
- **`docs/UPSTREAM_DEFECTS.md`** — Active upstream EN defect registry (UD-001..UD-022), allocation protocol, removal SOP.
- **`scripts/README.md`** — Full reference for all scripts, commands, parity check types, and npm script mappings.

## Content Rules

Content rules are defined in the authority sources. Do not duplicate rules here — refer to:

- **`docs/WRITING_GUIDE.md`** for frontmatter, internal links (`/docs/{slug}`), callouts (`:::`), source-first structure contract (heading mapping, `:fa-arrow-right:` → bold text, `<details>` preservation, JA-only section removal), Testim terminology English retention
- **`docs/TRANSLATION_GUIDE.md`** for natural Japanese, NG/OK patterns, terminology table, media handling

## Review & Feedback

Review workflow and feedback loop are defined in **`docs/OPS_DESIGN.md`**. Summary:

1. Self-check → Codex CLI review → fix → `npm run lint && npm run test && npm run build`
2. When new patterns emerge, update the relevant guide (not just the affected file)

## Core Invariants (from `docs/SYSTEM_SPEC.md`)

本プロジェクトのコア仕様。全作業はこれらの不変量を維持する方向で行う。
**仕様変更が必要と判断した場合は、必ずユーザーに確認してから実施すること。** 提案は歓迎するが、承認なしに不変量を変更・緩和してはならない。

**5-counter = 0 DoD**: 以下の 5 counter は全て 0 を維持する。

1. `parity-baseline.json` `entries.length` === 0
2. `parity-check-status.json` `summary.reportableActiveFiles` === 0
3. `parity-check-status.json` `summary.baselinedIssues` === 0
4. `parity-check-status.json` `summary.advisoryQueueIssues` === 0
5. `parity-check-status.json` `summary.auditSignalIssues` === 0

**2-mechanism suppression**: EN 上流欠陥の抑制は以下の 2 mechanism のみ。第三の mechanism は禁止。

- Mechanism 1: page-level freeze (`scripts/lib/source_sync_exclusions.mjs`)
- Mechanism 2: segment-level patch (`scripts/lib/en_source_patches.mjs`) → `docs/UPSTREAM_DEFECTS.md` に結線

**Baseline 運用**: Schema v2, `entries.length === 0` を維持。新規 issue は baseline に逃がさず修正で解消する。

詳細は **`docs/SYSTEM_SPEC.md`**、パリティ維持の運用手順は **`docs/PARITY_GUIDE.md`** を参照。

## Commit Style

Prefix: `docs:`, `feat:`, `fix:`, etc. Branch naming: `claude/{topic}`.
