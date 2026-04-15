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
 * Phase 4 registry に登録済みの EN-side artifact token 集合。
 * (slug, token) 対応は失うが、カテゴリ分類では token 単位で見れば十分。
 */
const EN_SIDE_ARTIFACT_TOKENS_FROM_REGISTRY = new Set(
  ARTIFACT_REGISTRY.map((e) => e.token),
);

/**
 * 単一トークンを category に分類する。
 *
 * Category:
 *   - enSideArtifact: EN 側 typo / 不正リンクで JA 側修正不能 (registry 登録済)
 *   - cliFlag        : `--flag` / `-f` 形式の CLI フラグ
 *   - internalLink   : `/docs/...` 形式の内部リンク
 *   - numericOrUnit  : 数値 + 単位 (`1000ms`, `10MB` 等)
 *   - externalUrl    : `http(s)://...` 形式の外部 URL
 *   - other          : 上記に当てはまらないもの
 */
export function categorizeToken(token) {
  if (!token) return 'other';
  if (EN_SIDE_ARTIFACT_TOKENS_FROM_REGISTRY.has(token)) return 'enSideArtifact';
  if (token.startsWith('--') || /^-[a-zA-Z]/.test(token)) return 'cliFlag';
  if (token.startsWith('/docs/')) return 'internalLink';
  if (/^\d+(\.\d+)?(ms|sec|s|min|hr|px|em|rem|MB|GB|KB|%|x)$/i.test(token)) {
    return 'numericOrUnit';
  }
  if (token.startsWith('http')) return 'externalUrl';
  return 'other';
}
