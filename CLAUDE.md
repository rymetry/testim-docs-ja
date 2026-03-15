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
| `npm run docs:pipeline` | Run full doc sync pipeline (fetch, translate, etc.) |

## Architecture

- **Content**: Markdown files in `src/content/docs/` organized by category folders. Schema defined in `src/content/config.ts` (Zod validation).
- **Routing**: Single dynamic route `src/pages/docs/[slug].astro` — slug is filename only, not the folder path (e.g., `overview/testim-overview.md` → `/docs/testim-overview`).
- **Navigation**: Built from `src/lib/docs.ts` `buildNavigation()` — groups by `category` frontmatter, ordered by `docs/SIDEBAR_URLS.md`.
- **Search**: Client-side MiniSearch in `src/components/SearchModal.tsx` (React), with data from `/api/search.json`.
- **Layout**: `src/layouts/DocsLayout.astro` wraps all doc pages with sidebar (`NavSidebar.astro`) and TOC (`TableOfContents.astro`).
- **Auth mode**: `BASIC_AUTH_ENABLED` env var toggles between SSR+auth (review) and static (production). See `src/middleware.ts`.
- **Doc pipeline**: `scripts/pipeline.mjs` orchestrates fetching English sources, generating placeholders, and preparing LLM translation tasks. Checkpoint-based resume via `scripts/.checkpoint`.

## Authority Sources

- **`docs/SIDEBAR_URLS.md`** — Master list of all documentation URLs, categories, and page ordering. This is the single source of truth for what pages exist and their structure.
- **`docs/WRITING_GUIDE.md`** — Authoritative rules for content formatting, frontmatter, links, and callouts.
- **`docs/TRANSLATION_GUIDE.md`** — Translation workflow procedures.

## Content Rules

### Frontmatter (required fields)

```yaml
---
title: 'Japanese title'
description: 'Content summary in Japanese (not a URL or placeholder)'
category: 'カテゴリ名'
order: 10
updated: '2025-03-15'        # Sync with English original's update date
sourceUrl: 'https://help.testim.io/docs/{slug}'  # Required, single-slug format
keywords: [keyword1, keyword2]
---
```

### Internal links

Always use `/docs/{slug}` format. Never include the category folder path.

```markdown
# Correct
[Testim 概要](/docs/testim-overview)

# Wrong — no folder path
[Testim 概要](/docs/overview/testim-overview)
```

### Callouts

Use `:::` directive syntax with these types only: `tip`, `warning`, `success`, `danger`, `note`, `info`. Custom titles via `{title="..."}`.

```markdown
:::warning{title="注意"}
Content here
:::
```

### Terminology

Testim product names, feature names, UI labels, and screen names stay in English (e.g., "Visual Editor", "Smart Locators", "Test Suite", "Testim Extension"). Do not translate these to Japanese. Add Japanese explanations in the body text if needed.

### Source fidelity

Pages with `sourceUrl` must faithfully reflect the English original — all paragraphs, numbered steps, callouts, and images must be included in correct order. Supplementary Japanese explanations may be added but must not replace original content.

## Commit Style

Prefix: `docs:`, `feat:`, `fix:`, etc. Branch naming: `codex/{topic}`.
