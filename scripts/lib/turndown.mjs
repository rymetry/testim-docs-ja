/**
 * Shared TurndownService singleton for HTML → Markdown conversion.
 * Configuration is centralized here to prevent divergence across consumers.
 *
 * Custom rules handle MadCap Flare HTML patterns that the default rules
 * cannot convert accurately:
 *   - <div class="note|caution"> → :::note / :::caution directives
 *   - <a class="codeSnippetCopyButton"> → stripped (parity noise)
 *   - <ol> with interspersed <img>, <p>, <div>, <ul> siblings alongside <li>
 *   - <table> → Markdown pipe table
 */

import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// ---------------------------------------------------------------------------
// MadCap Flare callout: <div class="note|caution"> → :::directive
// ---------------------------------------------------------------------------

const CALLOUT_CLASS_MAP = {
  note: 'note',
  caution: 'caution',
};

turndown.addRule('madcap-callout', {
  filter(node) {
    if (node.nodeName !== 'DIV') return false;
    const cls = (node.getAttribute('class') || '').trim();
    return Object.hasOwn(CALLOUT_CLASS_MAP, cls);
  },
  replacement(content, node) {
    const cls = (node.getAttribute('class') || '').trim();
    const directive = CALLOUT_CLASS_MAP[cls];
    if (!directive) return content;
    return `\n\n:::${directive}\n${content.trim()}\n:::\n\n`;
  },
});

// ---------------------------------------------------------------------------
// MadCap Flare code snippet: strip <a class="codeSnippetCopyButton">
//
// EN HTML wraps code blocks in <div class="codeSnippet"> which contains an
// <a class="codeSnippetCopyButton">Copy</a> link. Without this rule, turndown
// emits "[Copy](javascript:void(0);)" as a text paragraph, inflating
// paragraph counts in parity checks.
// ---------------------------------------------------------------------------

turndown.addRule('madcap-code-snippet-copy', {
  filter(node) {
    if (node.nodeName !== 'A') return false;
    const classes = (node.getAttribute('class') || '').split(/\s+/);
    return classes.includes('codeSnippetCopyButton');
  },
  replacement() {
    return '';
  },
});

// ---------------------------------------------------------------------------
// MadCap Flare ordered list: <ol> with <li>/<img>/<p>/<div>/<ul> siblings
//
// MadCap Flare produces <ol> blocks where <img>, <p>, <div class="note">,
// and <ul> appear as siblings of <li> (not nested inside <li>).
// Default turndown cannot handle this — it drops or merges siblings.
//
// This rule walks the child nodes of <ol> and reconstructs the list:
//   - <li value="N"> → "N. content"
//   - Non-<li> siblings are emitted as block content between steps
// ---------------------------------------------------------------------------

turndown.addRule('madcap-ordered-list', {
  filter: 'ol',
  replacement(_content, node) {
    const children = Array.from(node.childNodes);
    const parts = [];

    for (const child of children) {
      // Skip pure whitespace text nodes
      if (child.nodeType === 3 && !child.textContent.trim()) continue;

      if (child.nodeName === 'LI') {
        const value = child.getAttribute('value');
        const inner = turndown.turndown(child.innerHTML).trim();
        if (value) {
          parts.push(`${value}. ${inner}`);
        } else {
          // <li> without value — sub-item within the list
          parts.push(`- ${inner}`);
        }
      } else {
        // Non-<li> sibling: convert to markdown and emit as block content
        const md = turndown.turndown(child.outerHTML || child.textContent).trim();
        if (md) {
          parts.push(md);
        }
      }
    }

    return '\n\n' + parts.join('\n\n') + '\n\n';
  },
});

// ---------------------------------------------------------------------------
// MadCap Flare table: <table class="TableStyle-Table_new"> → Markdown pipe table
//
// MadCap uses <p class="tableBody|tableHeading"> inside <td>/<th>, plus
// <col> elements and style attributes that confuse default turndown.
// All 47 EN tables follow the same pattern: <thead> + <tbody>, single class.
// ---------------------------------------------------------------------------

/**
 * Extract text content from a table cell node, converting inner HTML to MD.
 * Collapses to a single line for pipe table cells.
 */
function cellToMd(cellNode) {
  const inner = turndown.turndown(cellNode.innerHTML).trim();
  return inner.replace(/\n+/g, ' ').replace(/\|/g, '\\|');
}

turndown.addRule('madcap-table', {
  filter(node) {
    return node.nodeName === 'TABLE';
  },
  replacement(_content, node) {
    // node.rows is available via HTMLTableElement API (turndown's DOM).
    // Fall back to default content if rows API is unavailable.
    if (!node.rows || node.rows.length === 0) return _content;

    const rows = [];
    for (let i = 0; i < node.rows.length; i++) {
      const row = node.rows[i];
      const cells = [];
      if (row.cells) {
        for (let j = 0; j < row.cells.length; j++) {
          cells.push(cellToMd(row.cells[j]));
        }
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return '';

    const colCount = Math.max(...rows.map((r) => r.length));

    const lines = [];
    for (let i = 0; i < rows.length; i++) {
      const padded = rows[i].concat(Array(colCount - rows[i].length).fill(''));
      lines.push('| ' + padded.join(' | ') + ' |');

      if (i === 0) {
        lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
      }
    }

    return '\n\n' + lines.join('\n') + '\n\n';
  },
});

// ---------------------------------------------------------------------------
// HTML <details>/<summary> → ## heading + content
//
// MadCap FAQ pages use <details><summary><b>Question</b></summary> Answer</details>.
// JA translations use H2 headings for each Q&A. This rule converts <summary>
// to H2 headings so the structural comparison aligns.
// ---------------------------------------------------------------------------

turndown.addRule('html-details', {
  filter: 'details',
  replacement(content) {
    return '\n\n' + content.trim() + '\n\n';
  },
});

turndown.addRule('html-summary', {
  filter: 'summary',
  replacement(content) {
    return '\n\n## ' + content.trim() + '\n\n';
  },
});

// ---------------------------------------------------------------------------
// EN HTML preprocessing: normalize MadCap artifacts before turndown conversion
//
// preprocessEnHtml() normalizes EN HTML before turndown conversion:
//   - Unescapes HTML-entity-encoded <details> blocks in <p> elements
//   - Converts escaped callout patterns (&gt; Title &gt; &gt; Content) to
//     <div class="note"> for the madcap-callout rule
//
// NOTE: The <p> regex assumes MadCap-generated HTML where attributes never
// contain '>' or '</p>'. If processing arbitrary HTML, use a DOM parser.
// ---------------------------------------------------------------------------

/** Detect likely attribute truncation from `>` inside attribute values. */
function hasTruncatedAttribute(innerHtml) {
  return /^[^<]*">/.test(innerHtml);
}

/**
 * Unescape HTML-entity-encoded `<details><summary>` blocks inside <p> elements.
 *
 * MadCap sometimes serializes `<details>` FAQ accordions as escaped entities
 * inside `<p>`, e.g. `<p>&lt;details&gt; &lt;summary&gt;...&lt;/summary&gt; ...&lt;/details&gt;</p>`.
 * This restores them to real HTML so turndown's details/summary rules can convert them.
 */
function unescapeDetails(html) {
  return html.replace(
    /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
    (fullMatch, innerHtml) => {
      if (hasTruncatedAttribute(innerHtml)) return fullMatch;

      const trimmed = innerHtml.trim();
      const startsWithOpen = trimmed.startsWith('&lt;details&gt;');
      const startsWithCloseAndOpen =
        trimmed.startsWith('&lt;/details&gt;') && trimmed.includes('&lt;details&gt;');
      if (!startsWithOpen && !startsWithCloseAndOpen) {
        return fullMatch;
      }
      const unescaped = trimmed
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      return unescaped;
    }
  );
}

/**
 * Issue #247 post-merge (Finding 9-14) — `faq` の multi-paragraph broken
 * details tree を valid sibling `<h2>/<p>` block に再構成する。
 *
 * MadCap は `<details><summary>Q</summary>body</details>` という FAQ
 * アコーディオンを、複数の `<p>` に跨って escape entity で出力する
 * パターンがある。その状態では以下の既存経路では処理できない:
 *
 *   - 既存の `unescapeDetails` は「先頭が `&lt;details&gt;` かつ同じ `<p>`
 *     内で閉じている」ケースしか扱わない。`faq` は <p> を跨ぐので対象外
 *   - `summary -> <h2>` の global 置換だけだと `<p><h2>Q</h2>...` という
 *     invalid HTML が残る。`turndown` は DOM repair で見かけ上回復できる
 *     が、`extractSegmentsFromHtml()` は DOM repair 無しで tokenize する
 *     ため heading を拾えず、faq は `heading-count-mismatch` に落ちる
 *
 * この関数は以下の条件をすべて満たす場合にだけ、HTML 全体を
 * paragraph-aware に rewrite し、valid sibling block を emit する:
 *
 *   1. `&lt;details&gt;` open と `&lt;/details&gt;` close の件数が一致
 *      (不均衡 = source-unusable 経路は detector に任せる)
 *   2. **少なくとも 1 つの `<p>` が trimmed で `&lt;details&gt;` から開始**
 *      — これが `faq` と `coding-assistant` を分ける discriminator。
 *      `coding-assistant` は `<p>Here are some examples ... &lt;details&gt;...`
 *      のように prose が先行するため、ここで弾かれる
 *
 * 段落境界の rewrite は以下の 3 ケースを別々に処理して、必ず valid な
 * `<h2></h2><p>...</p>` sibling block を emit する (invalid `<p><h2>`
 * ネストを一切作らない):
 *
 *   A. paragraph-start opener:
 *      `<p>&lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt; body`
 *      → `<h2>Q</h2><p>body`
 *   B. paragraph-start close+opener:
 *      `<p>&lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt; body`
 *      → `<h2>Q</h2><p>body`
 *   C. mid-paragraph boundary (同じ `<p>` 内で複数 QnA が連続するケース):
 *      `... body1 &lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q2&lt;/summary&gt; body2 ...`
 *      → `... body1 </p><h2>Q2</h2><p>body2 ...`
 *
 * summary 内部は `&lt;b&gt;...&lt;/b&gt;` (escaped `<b>` タグ) が含まれて
 * いる可能性があるので、heading 抽出時に残存 escaped HTML entity を
 * 保険で strip する。末尾の `<p>&lt;/details&gt;</p>` や residual close
 * marker は最後にまとめて除去する。
 *
 * **契約**: EN extractor / JA extractor / structure comparator の frozen
 * vocabulary (`details-summary` 等) は一切触らない。影響範囲は
 * preprocessor 内に閉じる。
 *
 * @param {string} html
 * @returns {string}
 */
function normalizeEscapedFaqDetails(html) {
  const openRe = /&lt;details(\b[^&]*)?&gt;/gi;
  const closeRe = /&lt;\/details&gt;/gi;
  const openCount = (html.match(openRe) || []).length;
  const closeCount = (html.match(closeRe) || []).length;
  if (openCount === 0 || openCount !== closeCount) return html;

  // discriminator (2 段階):
  //   1. 最初に trimmed で `&lt;details&gt;` から開始する <p> を探す。
  //      coding-assistant のように prose が先行するケースはここで弾く。
  //   2. その <p> が自分の中で balanced に閉じている (open == close) なら、
  //      それは legacy single-<p> ケース (例: `preprocessEnHtml escaped
  //      details` の既存テスト)。legacy `unescapeDetails` に任せる。
  //      unbalanced なら faq のような multi-paragraph broken tree なので
  //      新しい paragraph-aware rewrite を適用する。
  const pSegments = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  const firstFaqP = pSegments.find((pm) => {
    const inner = pm[1] || '';
    return inner.trim().startsWith('&lt;details&gt;');
  });
  if (!firstFaqP) return html;
  const firstInner = firstFaqP[1] || '';
  const firstOpens = (firstInner.match(openRe) || []).length;
  const firstCloses = (firstInner.match(closeRe) || []).length;
  if (firstOpens === firstCloses) return html;

  // summary inner から escaped HTML tag を取り除いて heading 文字列にする。
  // `&lt;b&gt;Q&lt;/b&gt;` のような残存タグを保険で strip する。
  const extractHeading = (summaryInner) =>
    summaryInner
      .replace(/&lt;\/?[a-z][^&]*&gt;/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  const pOpen = (attrs = '') => `<p${attrs || ''}>`;

  let out = html;
  // A. `<p>&lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt;` で始まるケース
  //    → `<h2>Q</h2><p>` の sibling block に書き換え、元の <p> の body は
  //    そのまま後続にぶら下がる
  out = out.replace(
    /<p(\b[^>]*)>\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?\s*&lt;\/summary&gt;\s*/gi,
    (_m, attrs, headingInner) => `<h2>${extractHeading(headingInner)}</h2>${pOpen(attrs)}`,
  );
  // B. `<p>&lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt;` で
  //    始まるケース(直前段落で QnA が閉じていて、新しい `<p>` の先頭で
  //    次の QnA が始まる faq のパターン)
  out = out.replace(
    /<p(\b[^>]*)>\s*&lt;\/details&gt;\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?\s*&lt;\/summary&gt;\s*/gi,
    (_m, attrs, headingInner) => `<h2>${extractHeading(headingInner)}</h2>${pOpen(attrs)}`,
  );
  // C. 同じ `<p>` 内で QnA が連続するケース(mid-paragraph boundary)。
  //    `</p><h2>Q2</h2><p>` を挿入して、新しい sibling block にバトンを渡す。
  out = out.replace(
    /&lt;\/details&gt;\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?\s*&lt;\/summary&gt;\s*/gi,
    (_m, headingInner) => `</p><h2>${extractHeading(headingInner)}</h2><p>`,
  );
  // 末尾の `<p>&lt;/details&gt;</p>` を除去し、残存 open/close marker も
  // まとめて削除する。最後に空 `<p></p>` が出来ていれば掃除する。
  out = out.replace(/<p\b[^>]*>\s*&lt;\/details&gt;\s*<\/p>/gi, '');
  out = out.replace(openRe, '');
  out = out.replace(closeRe, '');
  out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, '');
  return out;
}

/**
 * Convert escaped callout patterns (`&gt; Title &gt; &gt; Content`)
 * inside `<p>` elements to `<div class="note">` for the madcap-callout rule.
 *
 * Only matches when the first `&gt;` appears at or near the start of the `<p>`
 * content. Mid-paragraph `&gt;` patterns (e.g. instructional text about the
 * `>` operator) are left unchanged to prevent false positives.
 */
function normalizeEscapedCallouts(html) {
  return html.replace(
    /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
    (fullMatch, innerHtml) => {
      if (hasTruncatedAttribute(innerHtml)) return fullMatch;

      const firstGt = innerHtml.indexOf('&gt;');
      if (firstGt === -1) return fullMatch;

      // Guard: real MadCap callouts start with &gt; (possibly preceded by
      // whitespace only). If there is substantial text before the first &gt;,
      // this is not a callout — skip to avoid false positives.
      const textBefore = innerHtml.slice(0, firstGt).trim();
      if (textBefore.length > 0) return fullMatch;

      const afterOpening = innerHtml.slice(firstGt + 4);
      const sepMatch = afterOpening.match(/&gt;\s*&gt;/);
      if (!sepMatch) return fullMatch;

      const sepAbsIndex = firstGt + 4 + sepMatch.index;
      // Title is intentionally dropped — JA translations use :::note without
      // titles, and the madcap-callout rule only emits the directive + body.
      const body = innerHtml.slice(sepAbsIndex + sepMatch[0].length).trim();

      if (!body) return fullMatch;

      const noteDiv = `<div class="note"><p>${body}</p></div>`;
      return noteDiv;
    }
  );
}

/**
 * Normalize EN HTML before turndown conversion.
 *
 * Chains three preprocessing steps (Issue #247 post-merge で Step 3 を追加):
 *   1. `normalizeEscapedCallouts` — convert escaped `>` callout patterns
 *   2. `normalizeEscapedFaqDetails` — `faq` の broken escaped details tree を
 *      valid sibling `<h2>/<p>` block に再構成する(Finding 9-14)。faq
 *      discriminator で発火するので coding-assistant など prose 先行の
 *      ページには影響しない
 *   3. `unescapeDetails` — legacy single-<p> の escaped details 復元経路
 *      (coding-assistant のようにドキュメント内の `<details>` 使用例を
 *      real `<details>` に戻す古い処理を維持する)
 *
 * @param {string} html - Raw MadCap Flare HTML from EN snapshot
 * @returns {string} Normalized HTML for both turndown and EN extractor
 */
export function preprocessEnHtml(html) {
  if (typeof html !== 'string') {
    throw new TypeError(`preprocessEnHtml expected string, got ${typeof html}`);
  }
  return unescapeDetails(normalizeEscapedFaqDetails(normalizeEscapedCallouts(html)));
}

/**
 * Convert EN HTML to Markdown in a single call (preprocess + turndown).
 *
 * Use this instead of calling `preprocessEnHtml` + `turndown.turndown`
 * separately to avoid the implicit two-step protocol.
 *
 * @param {string} html - Raw MadCap Flare HTML from EN snapshot
 * @returns {string} Markdown output
 */
export function convertEnHtmlToMd(html) {
  return turndown.turndown(preprocessEnHtml(html));
}

export default turndown;
