# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Japanese localization of Testim Help Documentation (help.testim.io). Built with Astro 5, Tailwind CSS v4, TypeScript, and React (for search UI only). Deployed on Vercel. All responses and content should be in Japanese.

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build (runs `astro check` + build) |
| `npm run check` | TypeScript/Astro type checking only |
| `npm run lint` | Markdown lint (markdownlint) |
| `npm run lint:fix` | Auto-fix markdown lint issues |
| `npm run format` | Format with Prettier (Astro, TS, MD) |
| `npm run format:check` | Check formatting compliance |
| `npm run test` | Run tests in `scripts/__tests__/` |
| `npm run check:updates` | Check which Japanese docs need updating vs English originals |
| `npm run check:parity` | Source parity check (untranslated text, legacy callouts, orphans) |
| `npm run check:parity:remote` | Source parity + remote English comparison (headings, images) |
| `npm run docs:pipeline` | Run full doc sync pipeline (fetch, translate, etc.) |

## Architecture

- **Content**: Markdown files in `src/content/docs/` organized by category folders. Schema defined in `src/content.config.ts` (Zod validation).
- **Routing**: Single dynamic route `src/pages/docs/[slug].astro` — slug is filename only, not the folder path (e.g., `overview/testim-overview.md` → `/docs/testim-overview`).
- **Navigation**: Built from `src/lib/docs.ts` `buildNavigation()` — groups by `category` frontmatter, ordered by `docs/SIDEBAR_URLS.md`.
- **Search**: Client-side MiniSearch in `src/components/SearchModal.tsx` (React), with data from `/api/search.json`.
- **Layout**: `src/layouts/DocsLayout.astro` wraps all doc pages with sidebar (`NavSidebar.astro`) and TOC (`TableOfContents.astro`).
- **Auth mode**: `BASIC_AUTH_ENABLED` env var toggles between SSR+auth (review) and static (production). See `src/middleware.ts`.
- **Doc pipeline**: `scripts/pipeline.mjs` orchestrates fetching English sources, generating placeholders, and preparing LLM translation tasks. Checkpoint-based resume via `scripts/.checkpoint`.

## Authority Sources

- **`docs/SIDEBAR_URLS.md`** — Master list of all documentation URLs, categories, and page ordering. Single source of truth for what pages exist and their structure.
- **`docs/WRITING_GUIDE.md`** — Authoritative rules for content formatting, frontmatter, links, callouts, and Testim terminology English retention.
- **`docs/TRANSLATION_GUIDE.md`** — Translation workflow, natural Japanese guidelines, NG/OK patterns, terminology table.
- **`docs/OPS_DESIGN.md`** — Operational design: sync/diff/translate/QA flow, review policy, CI schedule, feedback loop.

## Content Rules

Content rules are defined in the authority sources. Do not duplicate rules here — refer to:

- **`docs/WRITING_GUIDE.md`** for frontmatter, internal links (`/docs/{slug}`), callouts (`:::`), source fidelity, Testim terminology English retention
- **`docs/TRANSLATION_GUIDE.md`** for natural Japanese, NG/OK patterns, terminology table, media handling

## Review & Feedback

Review workflow and feedback loop are defined in **`docs/OPS_DESIGN.md`**. Summary:

1. Self-check → Codex CLI review → fix → `npm run lint && npm run test && npm run build`
2. When new patterns emerge, update the relevant guide (not just the affected file)

## Commit Style

Prefix: `docs:`, `feat:`, `fix:`, etc. Branch naming: `claude/{topic}`.
