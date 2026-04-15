/**
 * Phase 2 enumerate scripts 共通ユーティリティ。
 *
 * 目的:
 *   - `parity-baseline.json` の読み込みを一箇所にまとめる
 *   - REPO_ROOT を相対パスで解決する
 *   - 既知 EN-side artifact を Phase 4 registry 経由で参照する
 *
 * Phase 4 で slug-scope の `parity_artifact_registry` に一本化したため、
 * enSideArtifact 判定は registry に登録済みの token を参照する。
 *
 * @module scripts/phase2/lib/baseline
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ARTIFACT_REGISTRY,
  NOOP_COVERAGE,
  createArtifactCoverage,
  isArtifactExcluded,
  registryEntries,
} from '../../lib/parity_artifact_registry.mjs';

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

// Phase 4: registry API を phase2 側から直接参照できるよう re-export。
export {
  ARTIFACT_REGISTRY,
  NOOP_COVERAGE,
  createArtifactCoverage,
  isArtifactExcluded,
  registryEntries,
};

/**
 * Phase 4 runtime registry に登録済みの EN-side artifact token 集合 (slug 非依存
 * の集計用)。
 */
const EN_SIDE_ARTIFACT_TOKENS_FROM_REGISTRY = new Set(
  ARTIFACT_REGISTRY.map((e) => e.token),
);

/**
 * Phase 2 enumerate 時代から `enSideArtifact` として扱われてきた legacy typo 系
 * token。Phase 4 runtime registry には載せない (実 runtime 影響が無く、slug-scope
 * 化の恩恵が無いため) が、phase2 の分析 / remediation planning では引き続き
 * artifact として扱えるよう互換保持する。
 *
 * 削除 / 変更する際は enumerate_token_gaps 出力の分類が静かに変わらないよう
 * 同 PR で下流の受け手を更新すること。
 */
const PHASE2_LEGACY_TYPO_TOKENS = new Set([
  '-variable',
  '-this',
  'step.This',
]);

/** phase2 `categorizeToken` の enSideArtifact 判定に使う union 集合。 */
const EN_SIDE_ARTIFACT_TOKENS_FOR_CATEGORIZATION = new Set([
  ...EN_SIDE_ARTIFACT_TOKENS_FROM_REGISTRY,
  ...PHASE2_LEGACY_TYPO_TOKENS,
]);

/**
 * 単一トークンを category に分類する。
 *
 * Category:
 *   - enSideArtifact: EN 側 typo / 不正リンクで JA 側修正不能 (Phase 4 registry +
 *                     phase2 legacy typo tokens の union)
 *   - cliFlag        : `--flag` / `-f` 形式の CLI フラグ
 *   - internalLink   : `/docs/...` 形式の内部リンク
 *   - numericOrUnit  : 数値 + 単位 (`1000ms`, `10MB` 等)
 *   - externalUrl    : `http(s)://...` 形式の外部 URL
 *   - other          : 上記に当てはまらないもの
 *
 * NOTE: runtime registry は slug-scope (`isArtifactExcluded({ slug, token })`)、
 * phase2 分析は token のみを見るため、両者は意図的に別機能として保持する。
 */
export function categorizeToken(token) {
  if (!token) return 'other';
  if (EN_SIDE_ARTIFACT_TOKENS_FOR_CATEGORIZATION.has(token)) return 'enSideArtifact';
  if (token.startsWith('--') || /^-[a-zA-Z]/.test(token)) return 'cliFlag';
  if (token.startsWith('/docs/')) return 'internalLink';
  if (/^\d+(\.\d+)?(ms|sec|s|min|hr|px|em|rem|MB|GB|KB|%|x)$/i.test(token)) {
    return 'numericOrUnit';
  }
  if (token.startsWith('http')) return 'externalUrl';
  return 'other';
}
