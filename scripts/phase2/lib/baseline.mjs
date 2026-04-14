/**
 * Phase 2 enumerate scripts 共通ユーティリティ。
 *
 * 目的:
 *   - `parity-baseline.json` の読み込みを一箇所にまとめる
 *   - REPO_ROOT を相対パスで解決する
 *   - 既知 EN-side artifact トークンを registry として共有
 *
 * Phase 2.3 report で浮上した EN-side artifact は、ここに登録することで
 * enumerate script が直接修正候補から除外し `enSideArtifact` カテゴリへ回せる。
 * Phase 4 で parity checker 側の修正に使う registry の雛形でもある。
 *
 * @module scripts/phase2/lib/baseline
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Repository root (scripts/phase2/lib/ から 3 階層上) */
export const REPO_ROOT = join(__dirname, '../../..');

/** `parity-baseline.json` を読み込む */
export function loadBaseline() {
  return JSON.parse(
    readFileSync(join(REPO_ROOT, 'parity-baseline.json'), 'utf8'),
  );
}

/**
 * 既知 EN-side artifact トークン。
 * Phase 2.3 (2026-04-14) で enumerate 時に skip 理由として記録したもの。
 * JA 側修正不能 / 要 EN 側修正 or parity normalizer 側修正。
 */
export const EN_SIDE_ARTIFACT_TOKENS = new Set([
  '-variable',   // "Generate email address -variable name" stray dash (EN typo, search-within-a-test)
  '-this',       // "Verify -this action" stray dash (EN typo, sfdc-step-{create,edit,quickactions,relatedlistaction,validate})
  'step.This',   // "step.This will create..." sentence boundary (EN typo, generate-random-data-with-js)
  '/docs/index', // EN の index.htm self-referential / unresolvable link (6 slugs)
]);

/**
 * EN-side artifact で「href 値として」既知不正なもの。
 * missingTokens に現れる URL を判定するのに使う。
 */
export const EN_SIDE_ARTIFACT_URLS = new Set([
  'http://google.com', // demo.testim.io link text に対して誤 href (creating-your-first-codeless-test)
]);

/**
 * 単一トークンを category に分類する。
 *
 * Category:
 *   - enSideArtifact: EN 側 typo / 不正リンクで JA 側修正不能
 *   - cliFlag        : `--flag` / `-f` 形式の CLI フラグ
 *   - internalLink   : `/docs/...` 形式の内部リンク
 *   - numericOrUnit  : 数値 + 単位 (`1000ms`, `10MB` 等)
 *   - externalUrl    : `http(s)://...` 形式の外部 URL
 *   - other          : 上記に当てはまらないもの
 */
export function categorizeToken(token) {
  if (!token) return 'other';
  if (EN_SIDE_ARTIFACT_TOKENS.has(token)) return 'enSideArtifact';
  if (EN_SIDE_ARTIFACT_URLS.has(token)) return 'enSideArtifact';
  if (token.startsWith('--') || /^-[a-zA-Z]/.test(token)) return 'cliFlag';
  if (token.startsWith('/docs/')) return 'internalLink';
  if (/^\d+(\.\d+)?(ms|sec|s|min|hr|px|em|rem|MB|GB|KB|%|x)$/i.test(token)) {
    return 'numericOrUnit';
  }
  if (token.startsWith('http')) return 'externalUrl';
  return 'other';
}
