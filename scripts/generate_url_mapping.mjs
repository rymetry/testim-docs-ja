#!/usr/bin/env node

/**
 * URL マッピング生成スクリプト
 *
 * 旧 help.testim.io の URL から新 docs.tricentis.com の URL へのマッピングを生成する。
 * 301 リダイレクトを辿って新しい URL を検出し、JSON ファイルに出力する。
 *
 * 使い方:
 *   node scripts/generate_url_mapping.mjs
 *
 * 出力:
 *   scripts/url_mapping.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// === 設定 ===
const SIDEBAR_PATH = resolve(ROOT, 'docs/SIDEBAR_URLS.md');
const OUTPUT_PATH = resolve(__dirname, 'url_mapping.json');
const MAX_RETRIES = 3; // 最大リトライ回数
const RETRY_DELAY_MS = 2000; // リトライ間隔（ミリ秒）
const REQUEST_DELAY_MS = 1000; // リクエスト間隔（ミリ秒）
const REQUEST_TIMEOUT_MS = 10000; // リクエストタイムアウト（ミリ秒）

/**
 * SIDEBAR_URLS.md から help.testim.io の URL を全件抽出する
 */
function extractUrls() {
  const content = readFileSync(SIDEBAR_PATH, 'utf-8');
  const urls = content.match(/https:\/\/help\.testim\.io\/docs\/[a-z0-9-]+/g);
  if (!urls || urls.length === 0) {
    throw new Error('SIDEBAR_URLS.md から URL を抽出できませんでした');
  }
  // 重複を除去
  return [...new Set(urls)];
}

/**
 * 指定ミリ秒だけ待機する
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * URL のスラグ部分を抽出する
 * 例: "https://help.testim.io/docs/testim-overview" → "testim-overview"
 */
function extractSlug(url) {
  const match = url.match(/\/docs\/([a-z0-9-]+)$/);
  return match ? match[1] : url;
}

/**
 * 1 件の URL に対して最終リダイレクト先を取得する（リトライ付き）
 * 中間リダイレクトを全て辿り、最終到達 URL を返す。
 */
async function resolveRedirect(url) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      // redirect: 'follow' で最終到達先まで自動的に辿る
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'testim-docs-ja/url-mapping-generator',
        },
      });

      clearTimeout(timeoutId);

      const status = res.status;
      const finalUrl = res.url; // fetch が辿った最終 URL

      // 最終 URL が元 URL と同じ = リダイレクトが発生していない
      if (finalUrl === url) {
        return { error: 'リダイレクトなし（200 応答）。移行先が検出できません', status };
      }

      // 最終到達先が 200 で、かつ元 URL と異なる = リダイレクト成功
      if (status === 200 && finalUrl !== url) {
        return { new_url: finalUrl, status: 301 };
      }

      // 522: Cloudflare タイムアウト — リトライ対象
      if (status === 522) {
        if (attempt < MAX_RETRIES) {
          console.log(`    ⚠ 522 エラー、${RETRY_DELAY_MS}ms 後にリトライ (${attempt}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return { error: `522 エラーが ${MAX_RETRIES} 回続きました`, status };
      }

      // その他のエラー
      return { error: `予期しないステータス: ${status} (最終URL: ${finalUrl})`, status };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const msg = err.name === 'AbortError' ? 'タイムアウト' : err.message;
        console.log(`    ⚠ ${msg}、${RETRY_DELAY_MS}ms 後にリトライ (${attempt}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { error: err.name === 'AbortError' ? 'タイムアウト' : err.message, status: 0 };
    }
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== URL マッピング生成スクリプト ===\n');

  // 1. URL 抽出
  const urls = extractUrls();
  console.log(`SIDEBAR_URLS.md から ${urls.length} 件の URL を抽出しました\n`);

  // 2. 各 URL のリダイレクト先を取得
  const mappings = {};
  const failures = [];
  let successCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = extractSlug(url);
    const progress = `[${String(i + 1).padStart(3)}/${urls.length}]`;

    process.stdout.write(`${progress} ${slug}... `);

    const result = await resolveRedirect(url);

    if (result.error) {
      console.log(`NG (${result.error})`);
      failures.push({ slug, old_url: url, error: result.error, status: result.status });
    } else {
      console.log(`OK → ${result.new_url}`);
      successCount++;
      mappings[slug] = {
        old_url: url,
        new_url: result.new_url,
        status: result.status,
      };
    }

    // レート制限対策: リクエスト間に遅延を挿入（最後の1件では不要）
    if (i < urls.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // 3. 結果を JSON に出力（失敗がある場合は既存ファイルを保護）
  const output = {
    generated_at: new Date().toISOString(),
    total: urls.length,
    success: successCount,
    failed: failures.length,
    mappings,
    failures,
  };

  if (failures.length > 0 && existsSync(OUTPUT_PATH)) {
    // 失敗がある場合は既存マッピングを上書きせず、別ファイルに出力
    const partialPath = OUTPUT_PATH.replace('.json', '.partial.json');
    writeFileSync(partialPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
    console.log(`\n⚠ ${failures.length} 件の失敗があるため、既存の ${OUTPUT_PATH} を保護しました`);
    console.log(`  部分結果: ${partialPath}`);
  } else {
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  }

  // 4. サマリー表示
  console.log('\n=== 完了 ===');
  console.log(`合計: ${urls.length} 件`);
  console.log(`成功: ${successCount} 件`);
  console.log(`失敗: ${failures.length} 件`);

  if (failures.length > 0) {
    console.log('\n=== 失敗した URL ===');
    for (const f of failures) {
      console.log(`  - ${f.slug}: ${f.error}`);
    }
    process.exit(1);
  }

  console.log(`出力: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('スクリプトの実行中にエラーが発生しました:', err);
  process.exit(1);
});
