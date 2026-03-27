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
| `npm run check:parity` | Source parity check (structure, tables, allowlist, EN normalization) |
| `npm run check:snapshots` | EN HTML snapshot fetch + diff (change detection) |
| `npm run check:snapshots:fetch` | Fetch EN HTML snapshots only |
| `npm run check:snapshots:diff` | Diff committed vs working tree snapshots only |
| `npm run docs:sync-sidebar` | Update SIDEBAR_URLS.md from MadCap Flare TOC data |
| `npm run docs:pipeline` | Run full doc sync pipeline (fetch, translate, etc.) |

**Single-page commands:**

```bash
npm run check:parity -- --slug=testim-overview
npm run check:snapshots:diff -- --slug=testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md
```

Full reference: `scripts/README.md`

## Architecture

- **Content**: Markdown files in `src/content/docs/` organized by category folders. Schema defined in `src/content.config.ts` (Zod validation).
- **Routing**: Single dynamic route `src/pages/docs/[slug].astro` — slug is filename only, not the folder path (e.g., `overview/testim-overview.md` → `/docs/testim-overview`).
- **Navigation**: Built from `src/lib/docs.ts` `buildNavigation()` — groups by `category` frontmatter, ordered by `docs/SIDEBAR_URLS.md`.
- **Search**: Client-side MiniSearch in `src/components/SearchModal.tsx` (React), with data from `/api/search.json`.
- **Layout**: `src/layouts/DocsLayout.astro` wraps all doc pages with sidebar (`NavSidebar.astro`) and TOC (`TableOfContents.astro`).
- **Auth mode**: `BASIC_AUTH_ENABLED` env var toggles between SSR+auth (review) and static (production). See `src/middleware.ts`.
- **Doc pipeline**: `scripts/pipeline.mjs` orchestrates fetching English sources, generating placeholders, and preparing LLM translation tasks. Checkpoint-based resume via `scripts/.checkpoint`.
- **Snapshot pipeline**:
  - **コンテンツ**: 各ページの HTML から `#mc-main-content` を抽出し `snapshots/en/content/{slug}.html` に保存
  - **サイドバー**: MadCap Flare TOC データ (`scripts/lib/madcap_toc.mjs`) を解析し `snapshots/en/sidebar.json` に保存
  - **パリティ比較**: HTML スナップショットを `turndown` で Markdown 変換後、JA 翻訳と構造比較

## Authority Sources

- **`docs/SIDEBAR_URLS.md`** — Master list of all documentation URLs, categories, and page ordering. Single source of truth for what pages exist and their structure.
- **`docs/WRITING_GUIDE.md`** — Authoritative rules for content formatting, frontmatter, links, callouts, source-first structure contract (heading mapping, `:fa-arrow-right:` handling, `<details>` preservation, JA-only section removal), Testim terminology English retention.
- **`docs/TRANSLATION_GUIDE.md`** — Translation workflow, natural Japanese guidelines, NG/OK patterns, terminology table.
- **`docs/OPS_DESIGN.md`** — Operational design: sync/diff/translate/QA flow, review policy, feedback loop.
- **`docs/DOCS_DATE_TRACKING.md`** — Snapshot-based change detection: HTML snapshot format, sidebar JSON structure, diff classification, CI workflow, and translation sync process.
- **`scripts/README.md`** — Full reference for all scripts, commands, parity check types, and npm script mappings.

## Content Rules

Content rules are defined in the authority sources. Do not duplicate rules here — refer to:

- **`docs/WRITING_GUIDE.md`** for frontmatter, internal links (`/docs/{slug}`), callouts (`:::`), source-first structure contract (heading mapping, `:fa-arrow-right:` → bold text, `<details>` preservation, JA-only section removal), Testim terminology English retention
- **`docs/TRANSLATION_GUIDE.md`** for natural Japanese, NG/OK patterns, terminology table, media handling

## Review & Feedback

Review workflow and feedback loop are defined in **`docs/OPS_DESIGN.md`**. Summary:

1. Self-check → Codex CLI review → fix → `npm run lint && npm run test && npm run build`
2. When new patterns emerge, update the relevant guide (not just the affected file)

## Commit Style

Prefix: `docs:`, `feat:`, `fix:`, etc. Branch naming: `claude/{topic}`.
