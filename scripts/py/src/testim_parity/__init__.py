"""Python port of the testim-docs-ja parity/sync tooling.

**Public API は各モジュールが個別に ``__all__`` で宣言する**。ルートパッケージ
は re-export を行わない (M3 指摘)。Phase 1-4 で leaf が 50+ 追加される見込み
のため、flat な ``__init__.__all__`` では dual maintenance が破綻する。

代わりに ``from testim_parity.<module> import <name>`` を正とする。新規 leaf
を port したら、その module 内の ``__all__`` に name を追加し、conformance
harness (``scripts/py/conformance/harness.mjs``) の DISPATCH へ同時登録する。

現在の module surface (Phase 3 M4 時点、layer 順):

**基盤 (Phase 0)**:

- ``testim_parity.align_scoring`` — weighted-LCS pair scoring
- ``testim_parity.artifact_registry`` — artifact 除外 registry と coverage
- ``testim_parity.en_source_patches`` — EN HTML patch 適用
- ``testim_parity.extract`` — markdown / HTML 構造抽出 + invariant token
- ``testim_parity.glossary_mask`` — glossary / invariant マスカー
- ``testim_parity.madcap_toc`` — MadCap Flare TOC パーサ
- ``testim_parity.models`` — 共有 Pydantic DTO
- ``testim_parity.normalize`` — URL 正規化
- ``testim_parity.project`` — プロジェクトファイル索引
- ``testim_parity.segments_shared`` — セグメント生成・指紋
- ``testim_parity.sidebar`` — SIDEBAR_URLS.md パーサ
- ``testim_parity.types`` — severity / pattern 定数

**Segment extractors (Phase 1-2)**:

- ``testim_parity.preprocess_en`` — EN HTML 前処理 (callout / details 正規化)
- ``testim_parity.segments_en`` — BS4 / lxml ベース EN segment 抽出
- ``testim_parity.segments_ja`` — markdown-it-py hybrid JA segment 抽出
- ``testim_parity.segments_ja_html`` — JA 用 HTML / details / table helpers
- ``testim_parity.turndown`` — HTML→MD 変換 (mjs ``convertEnHtmlToMd``
  相当、markdownify + MadCap custom converters。Phase 4b M1)

**基盤 predicates/registry (Phase 3 M1)**:

- ``testim_parity.summary_format`` — CLI 用 summary section formatter
- ``testim_parity.issue_state`` — parity issue の 9 状態判定述語
- ``testim_parity.sync_exclusions`` — source-side debt registry
- ``testim_parity.page_coverage`` — page-level completeness gate

**中規模 supporting (Phase 3 M2)**:

- ``testim_parity.acknowledgements`` — ack fingerprint + schema validation +
  issue tagging
- ``testim_parity.advisory_queue`` — tokenless near-tie review queue
- ``testim_parity.source_usability`` — Layer 1/2/3 source usability detector
- ``testim_parity.sync_health`` — ``source-sync-status.json`` builder

**比較エンジン (Phase 3 M3-M4)**:

- ``testim_parity.extract_lines`` — ``extract.py`` の line-level state machine
  切り出し (``classify_line`` + section 別 step/bullet/paragraph count)。
  consumer は ``extract.py`` 越しの re-export を使う
- ``testim_parity.structure`` — canonical block sequence comparator (3 stage)
- ``testim_parity.checks`` — count / shape / heuristic 比較 (segment 単位)
- ``testim_parity.align`` — weighted LCS alignment + ParityDiff 生成
- ``testim_parity.align_diffs`` — ``align.py`` の ParityDiff factory 切り出し +
  ``ALIGN_OUTPUT_SCHEMA_VERSION``。``align.py`` から import alias で使う

**Frozen baseline + 集計 (Phase 3 M5)**:

- ``testim_parity.baseline`` — baseline schema v2 (validate / build_key /
  structureFingerprint / tag_issues / orphan detection)
- ``testim_parity.summary`` — parity result を type / severity / ack / baseline
  の summary 統計に集計する純粋関数。5-counter = 0 DoD の権威ソース

**Mutation corpus (Phase 3 M6)**:

- ``testim_parity.mutation_corpus`` — diff=1 recall test 用の synthetic mutation
  generator (10 type × classify_lines + list/block extent helpers)。9/9 recall
  DoD の権威ソース

**検出レポート (Phase 3 M7)**:

- ``testim_parity.detection_reports`` — 4 artifact の schema validation +
  actionable report + summary markdown + upstream recovery sticky comment。
  4 issue family (snapshotDiff / parityRegression / sourceSyncHealth /
  parityFollowup) を組み立てる主エントリ。Phase 4 CLI script の build 基盤

**CLI scripts (Phase 4 — complete)**:

Detection (``testim_parity.detection.*``):

- ``check_patch_review_cadence`` — reviewAfter 過去超過 entry の non-blocking 警告
- ``check_source_parity`` — 主 parity gate (mjs subprocess wrapper。
  Phase 4b M2 で full port 予定、``turndown`` module は整備済)
- ``check_upstream_recovery`` — EN patch / sync exclusion の Axis A/B 集計 →
  ``upstream-recovery-status.json``
- ``find_untranslated`` — baseline の ``segment-untranslated`` slug を scan
- ``generate_detection_reports`` — 4 family report + summary markdown + audit manifest
- ``generate_parity_baseline`` — schema v2 baseline 生成 (regenerate / slug / types 3 mode)
- ``render_upstream_recovery_comment`` — PR sticky comment の markdown 書き出し
- ``snapshot_diff`` — committed vs working tree snapshot の diff (純 Python)
- ``snapshot_update`` — live EN HTML fetch (HTTP + mjs subprocess wrapper。
  Phase 4b M3 で full port 予定)

Pipeline (``testim_parity.pipeline.*``):

- ``apply_llm_translations`` — LLM 翻訳結果を atomic write で doc に反映
- ``fetch_translate_images`` — HTML→MD 変換 (mjs subprocess wrapper。
  Phase 4b M4 で ``turndown`` module に切替予定)
- ``generate_untranslated_placeholders`` — ⏳ page の placeholder md 生成
- ``pipeline`` — 5 step orchestration (url_collect / placeholders / fetch / prepare_llm / apply_llm)
- ``prepare_llm_tasks`` — 翻訳 task prompt 生成
- ``update_sidebar_urls_from_live`` — live TOC fetch → SIDEBAR_URLS.md 再生成

Tools (``testim_parity.tools.*``):

- ``check_glossary_duplicates`` — GLOSSARY.md の重複検出
- ``fix_alt_all`` — 空 alt の markdown 画像に日本語 alt を付与
- ``lint_docs`` — WRITING_GUIDE 準拠 lint
- ``normalize_docs`` — 用語揺れ正規化 + frontmatter 順序統一
- ``report_frontmatter_categories`` — category 集計 + SIDEBAR と照合
- ``sync_frontmatter_from_sidebar`` — SIDEBAR_URLS.md → frontmatter category/order

**Phase 5 以降の予定**: pytest 全書き直し / atomic cutover / COPY ボタン追加。
"""

from __future__ import annotations

__version__ = "0.0.1"

__all__ = ["__version__"]
