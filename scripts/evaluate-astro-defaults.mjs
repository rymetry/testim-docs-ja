#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFile, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { arch, cpus, platform, release } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { parse } from 'parse5';

const VARIANTS = new Set(['baseline', 'satteri', 'jsx']);
const MODES = new Set(['static', 'ssr']);
const CACHE_MODES = new Set(['cold', 'warm']);
const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'div',
  'dl',
  'fieldset',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);
const WHITESPACE_CONTAINER_TAGS = new Set([
  '#document',
  'article',
  'aside',
  'body',
  'div',
  'footer',
  'header',
  'html',
  'main',
  'nav',
  'section',
  'table',
  'tbody',
  'tfoot',
  'thead',
  'tr',
]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument near ${key ?? '<end>'}`);
    }
    args[key.slice(2)] = value;
  }

  const variant = args.variant;
  const mode = args.mode;
  const cache = args.cache;
  const rounds = Number.parseInt(args.rounds, 10);
  const artifactRoot = args['artifact-root'];

  if (!VARIANTS.has(variant)) throw new Error(`Unknown --variant: ${variant}`);
  if (!MODES.has(mode)) throw new Error(`Unknown --mode: ${mode}`);
  if (!CACHE_MODES.has(cache)) throw new Error(`Unknown --cache: ${cache}`);
  if (!Number.isInteger(rounds) || rounds < 1) throw new Error('--rounds must be >= 1');
  if (!artifactRoot) throw new Error('--artifact-root is required');

  return { variant, mode, cache, rounds, artifactRoot: resolve(artifactRoot) };
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise) => {
    const started = process.hrtime.bigint();
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    let stdout = '';
    let stderr = '';
    if (options.capture) {
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => (stdout += chunk));
      child.stderr.on('data', (chunk) => (stderr += chunk));
    }
    child.on('close', (exitCode, signal) => {
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      resolvePromise({ exitCode: exitCode ?? 1, signal, elapsedMs, stdout, stderr });
    });
  });
}

async function commandOutput(command, args, cwd) {
  const result = await run(command, args, { cwd, env: process.env, capture: true });
  if (result.exitCode !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function digestFile(filePath) {
  return digest(await readFile(filePath));
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function walk(root) {
  if (!(await pathExists(root))) return [];
  const results = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = join(root, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(filePath)));
    else if (entry.isFile()) results.push(filePath);
  }
  return results;
}

async function safeRemoveWorktreeOutput(worktreeRoot, target) {
  const allowed = new Set([
    resolve(worktreeRoot, 'dist'),
    resolve(worktreeRoot, '.astro'),
    resolve(worktreeRoot, '.vercel/output'),
    resolve(worktreeRoot, 'node_modules/.astro'),
  ]);
  const resolvedTarget = resolve(target);
  if (!allowed.has(resolvedTarget))
    throw new Error(`Refusing to remove unexpected path: ${target}`);
  await rm(resolvedTarget, { recursive: true, force: true });
}

async function safeRemoveArtifactTarget(artifactRoot, target) {
  const resolvedRoot = resolve(artifactRoot);
  const resolvedTarget = resolve(target);
  if (resolvedTarget === resolvedRoot || !resolvedTarget.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Refusing to remove artifact path outside root: ${target}`);
  }
  await rm(resolvedTarget, { recursive: true, force: true });
}

function attrs(node) {
  return Object.fromEntries((node.attrs ?? []).map((attr) => [attr.name, attr.value]));
}

function classes(node) {
  return (attrs(node).class ?? '').split(/\s+/).filter(Boolean);
}

function isElement(node, tagName) {
  return node?.nodeName === tagName || node?.tagName === tagName;
}

function findAll(node, predicate, results = []) {
  if (predicate(node)) results.push(node);
  for (const child of node.childNodes ?? []) findAll(child, predicate, results);
  return results;
}

function textContent(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(textContent).join('');
}

function canonicalAttributes(node) {
  return (node.attrs ?? [])
    .map(({ name, value }) => {
      if (name === 'class') {
        return [name, value.split(/\s+/).filter(Boolean).sort().join(' ')];
      }
      return [name, normalizeAssetHashes(value)];
    })
    .sort(([left], [right]) => left.localeCompare(right));
}

function normalizeAssetHashes(value) {
  return value.replace(
    /(\/_astro\/[^/?#]+?)[._-][a-zA-Z0-9_-]{8,}(\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|woff2?))(\?[^#]*)?(#.*)?$/g,
    '$1.__ASSET_HASH__$2$3$4'
  );
}

function shouldDropWhitespace(node, parent, index) {
  if (node.nodeName !== '#text' || node.value.trim() !== '') return false;
  const parentTag = parent?.tagName ?? parent?.nodeName;
  if (!WHITESPACE_CONTAINER_TAGS.has(parentTag)) return false;
  const siblings = parent.childNodes ?? [];
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  const blockOrBoundary = (sibling) => !sibling || BLOCK_TAGS.has(sibling.tagName);
  return blockOrBoundary(previous) && blockOrBoundary(next);
}

function canonicalNode(node, parent = null, index = 0) {
  if (!node) return null;
  if (shouldDropWhitespace(node, parent, index)) return null;
  if (node.nodeName === '#text') return { type: 'text', value: node.value };
  if (node.nodeName === '#comment') return null;
  if (!node.tagName) return null;

  const children = (node.childNodes ?? [])
    .map((child, childIndex) => canonicalNode(child, node, childIndex))
    .filter(Boolean);
  return {
    type: 'element',
    tag: node.tagName,
    attrs: canonicalAttributes(node),
    children,
  };
}

function routeFromHtml(distRoot, filePath) {
  const relativePath = relative(distRoot, filePath).split(sep).join('/');
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html'))
    return `/${relativePath.slice(0, -'index.html'.length)}`;
  return `/${relativePath.slice(0, -'.html'.length)}`;
}

function orderedJson(value) {
  if (Array.isArray(value)) return value.map(orderedJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, orderedJson(child)])
    );
  }
  return value;
}

async function collectStaticManifest(distRoot) {
  const files = await walk(distRoot);
  const htmlFiles = files.filter((filePath) => filePath.endsWith('.html')).sort();
  const routes = [];
  const documents = [];
  const rawHtmlIndex = [];
  let rawHtmlBytes = 0;
  let gzipHtmlBytes = 0;
  let brotliHtmlBytes = 0;

  for (const filePath of htmlFiles) {
    const buffer = await readFile(filePath);
    rawHtmlBytes += buffer.byteLength;
    gzipHtmlBytes += gzipSync(buffer).byteLength;
    brotliHtmlBytes += brotliCompressSync(buffer).byteLength;
    const route = routeFromHtml(distRoot, filePath);
    routes.push(route);
    rawHtmlIndex.push({ route, sha256: digest(buffer) });

    const document = parse(buffer.toString('utf8'));
    const article = findAll(document, (node) => isElement(node, 'article'))[0];
    if (!article) continue;

    const headings = findAll(article, (node) => /^h[1-6]$/.test(node.tagName ?? '')).map(
      (node) => ({
        depth: Number(node.tagName.slice(1)),
        id: attrs(node).id ?? null,
        text: textContent(node),
        links: findAll(
          node,
          (child) => isElement(child, 'a') && classes(child).includes('heading-link')
        ).map((link) => attrs(link).href ?? null),
      })
    );
    const callouts = findAll(
      article,
      (node) => isElement(node, 'aside') && classes(node).includes('callout')
    ).map((node) => ({
      classes: classes(node).sort(),
      title: textContent(
        findAll(node, (child) => classes(child).includes('callout-title'))[0] ?? { childNodes: [] }
      ),
      content: textContent(
        findAll(node, (child) => classes(child).includes('callout-content'))[0] ?? {
          childNodes: [],
        }
      ),
      hint: canonicalNode(
        findAll(node, (child) => classes(child).includes('callout-hint'))[0] ?? null
      ),
    }));
    const tables = findAll(article, (node) => isElement(node, 'table')).map((node) => ({
      cells: findAll(node, (child) => isElement(child, 'th') || isElement(child, 'td')).map(
        (cell) => ({
          tag: cell.tagName,
          text: textContent(cell),
          attrs: canonicalAttributes(cell),
        })
      ),
      parentClasses: classes(node.parentNode ?? {}).sort(),
    }));
    const expressiveCode = findAll(article, (node) =>
      classes(node).includes('expressive-code')
    ).map((node) => ({
      text: textContent(node),
      dom: canonicalNode(node),
    }));
    const images = findAll(article, (node) => isElement(node, 'img')).map((node) => {
      const properties = attrs(node);
      return {
        src: properties.src ?? null,
        alt: properties.alt ?? null,
        width: properties.width ?? null,
        height: properties.height ?? null,
      };
    });

    documents.push({
      route,
      dom: canonicalNode(article),
      headings,
      callouts,
      tables,
      expressiveCode,
      images,
    });
  }

  return {
    routes: routes.sort(),
    rawHtmlIndex: rawHtmlIndex.sort((left, right) => left.route.localeCompare(right.route)),
    documents: documents.sort((left, right) => left.route.localeCompare(right.route)),
    htmlSize: { raw: rawHtmlBytes, gzip: gzipHtmlBytes, brotli: brotliHtmlBytes },
  };
}

async function collectSearch(distRoot) {
  const searchFile = (await walk(distRoot)).find(
    (filePath) => relative(distRoot, filePath).split(sep).join('/') === 'api/search.json'
  );
  if (!searchFile) return null;
  const parsed = JSON.parse(await readFile(searchFile, 'utf8'));
  const entries = Array.isArray(parsed) ? parsed : (parsed.documents ?? parsed.entries ?? parsed);
  const ordered = orderedJson(entries);
  const byId = Array.isArray(entries)
    ? [...entries]
        .sort((left, right) => String(left.id).localeCompare(String(right.id)))
        .map(orderedJson)
    : ordered;
  return {
    count: Array.isArray(entries) ? entries.length : null,
    orderedDigest: digest(JSON.stringify(ordered)),
    setDigest: digest(JSON.stringify(byId)),
  };
}

async function collectSourceCounts(worktreeRoot) {
  const tracked = (
    await commandOutput('git', ['ls-files', 'src/content/docs/**/*.md'], worktreeRoot)
  )
    .split('\n')
    .filter(Boolean);
  let callouts = 0;
  let headingAttributes = 0;
  let codeFenceMarkers = 0;
  for (const relativePath of tracked) {
    const source = await readFile(join(worktreeRoot, relativePath), 'utf8');
    callouts += (source.match(/^:::(?:tip|warning|caution|danger|note|info)(?:\{|\s|$)/gm) ?? [])
      .length;
    headingAttributes += (source.match(/^#{1,6} .*\{#[^}]+\}\s*$/gm) ?? []).length;
    codeFenceMarkers += (source.match(/^```/gm) ?? []).length;
  }
  return {
    documents: tracked.length,
    callouts,
    headingAttributes,
    codeFenceMarkers,
    codeBlocks: codeFenceMarkers / 2,
  };
}

async function collectSitemap(distRoot) {
  const sitemapFiles = (await walk(distRoot)).filter((filePath) =>
    /sitemap.*\.xml$/.test(basename(filePath))
  );
  const locations = [];
  for (const filePath of sitemapFiles) {
    const xml = await readFile(filePath, 'utf8');
    for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) locations.push(match[1]);
  }
  return [...new Set(locations)].sort();
}

async function collectRedirects(vercelOutputRoot) {
  const configPath = join(vercelOutputRoot, 'config.json');
  if (!(await pathExists(configPath))) return [];
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  return (config.routes ?? [])
    .filter((route) => Number(route.status) >= 300 && Number(route.status) < 400)
    .map((route) => ({
      src: route.src,
      status: route.status,
      location: route.headers?.Location ?? null,
    }))
    .sort((left, right) => left.src.localeCompare(right.src));
}

async function collectFileManifest(root, predicate) {
  const entries = [];
  for (const filePath of (await walk(root)).filter(predicate).sort()) {
    const fileStat = await stat(filePath);
    entries.push({
      path: relative(root, filePath).split(sep).join('/'),
      bytes: fileStat.size,
      sha256: await digestFile(filePath),
    });
  }
  return entries;
}

async function collectManifest(worktreeRoot, mode) {
  const distRoot = join(worktreeRoot, 'dist');
  const vercelOutputRoot = join(worktreeRoot, '.vercel/output');
  const staticManifest = await collectStaticManifest(distRoot);
  const clientRoots = [distRoot, join(vercelOutputRoot, 'static')];
  const clientAssets = [];
  for (const root of clientRoots) {
    if (!(await pathExists(root))) continue;
    clientAssets.push(
      ...(await collectFileManifest(root, (filePath) => /\.(?:css|js|mjs)$/.test(filePath))).map(
        (entry) => ({
          root: basename(root),
          ...entry,
        })
      )
    );
  }
  const functionsRoot = join(vercelOutputRoot, 'functions');
  const functionFiles = await collectFileManifest(functionsRoot, () => true);
  const functionBytes = functionFiles.reduce((sum, entry) => sum + entry.bytes, 0);

  const documents = staticManifest.documents;
  return {
    mode,
    routes: staticManifest.routes,
    rawHtmlIndex: staticManifest.rawHtmlIndex,
    documents,
    source: await collectSourceCounts(worktreeRoot),
    counts: {
      documents: documents.length,
      contentDocuments: documents.filter((document) => document.route.startsWith('/docs/')).length,
      headings: documents.reduce((sum, doc) => sum + doc.headings.length, 0),
      callouts: documents
        .filter((document) => document.route.startsWith('/docs/'))
        .reduce((sum, doc) => sum + doc.callouts.length, 0),
      tables: documents.reduce((sum, doc) => sum + doc.tables.length, 0),
      expressiveCode: documents.reduce((sum, doc) => sum + doc.expressiveCode.length, 0),
    },
    htmlSize: staticManifest.htmlSize,
    search: await collectSearch(distRoot),
    sitemap: await collectSitemap(distRoot),
    redirects: await collectRedirects(vercelOutputRoot),
    clientAssets: clientAssets.sort((left, right) =>
      `${left.root}/${left.path}`.localeCompare(`${right.root}/${right.path}`)
    ),
    functions: {
      bytes: functionBytes,
      files: functionFiles,
      nativeFiles: functionFiles.filter((entry) => entry.path.endsWith('.node')),
      containsSatteriNapi: functionFiles.some((entry) => /satteri/i.test(entry.path)),
    },
  };
}

function compareManifests(baseline, candidate) {
  const sections = ['routes', 'documents', 'search', 'sitemap', 'redirects', 'clientAssets'];
  const results = Object.fromEntries(
    sections.map((section) => [
      section,
      JSON.stringify(baseline[section]) === JSON.stringify(candidate[section]),
    ])
  );
  return {
    pass: Object.values(results).every(Boolean),
    sections: results,
    diffIndex: {
      documents: documentDiffIndex(baseline.documents, candidate.documents),
      routes: setDiff(baseline.routes, candidate.routes),
      sitemap: setDiff(baseline.sitemap, candidate.sitemap),
      redirects: setDiff(
        baseline.redirects.map((redirect) => JSON.stringify(redirect)),
        candidate.redirects.map((redirect) => JSON.stringify(redirect))
      ),
      clientAssets: setDiff(
        baseline.clientAssets.map((asset) => JSON.stringify(asset)),
        candidate.clientAssets.map((asset) => JSON.stringify(asset))
      ),
    },
    observed: {
      baselineHtmlSize: baseline.htmlSize,
      candidateHtmlSize: candidate.htmlSize,
      baselineFunctionBytes: baseline.functions.bytes,
      candidateFunctionBytes: candidate.functions.bytes,
      candidateContainsSatteriNapi: candidate.functions.containsSatteriNapi,
    },
  };
}

function setDiff(baseline, candidate) {
  const baselineSet = new Set(baseline);
  const candidateSet = new Set(candidate);
  return {
    removed: baseline.filter((value) => !candidateSet.has(value)),
    added: candidate.filter((value) => !baselineSet.has(value)),
  };
}

function firstDifference(baseline, candidate, path = '$') {
  if (baseline === candidate) return null;
  if (
    baseline === null ||
    candidate === null ||
    typeof baseline !== 'object' ||
    typeof candidate !== 'object'
  ) {
    return { path, baseline: baseline ?? null, candidate: candidate ?? null };
  }
  if (Array.isArray(baseline) !== Array.isArray(candidate)) {
    return { path, baseline, candidate };
  }
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(candidate)])];
  for (const key of keys) {
    const difference = firstDifference(
      baseline[key],
      candidate[key],
      Array.isArray(baseline) ? `${path}[${key}]` : `${path}.${key}`
    );
    if (difference) return difference;
  }
  return null;
}

function documentDiffIndex(baseline, candidate) {
  const baselineByRoute = new Map(baseline.map((document) => [document.route, document]));
  return candidate.flatMap((document) => {
    const baselineDocument = baselineByRoute.get(document.route);
    if (JSON.stringify(baselineDocument) === JSON.stringify(document)) return [];
    const fields = Object.keys(document).filter(
      (field) => JSON.stringify(baselineDocument?.[field]) !== JSON.stringify(document[field])
    );
    return [
      {
        route: document.route,
        fields,
        firstDifference: firstDifference(baselineDocument, document),
      },
    ];
  });
}

async function collectEnvironment(worktreeRoot, baselineSha) {
  const lockPath = join(worktreeRoot, 'package-lock.json');
  const nativeRoot = join(worktreeRoot, 'node_modules/@bruits');
  const nativePackages = (await pathExists(nativeRoot))
    ? (await readdir(nativeRoot)).filter((name) => name.startsWith('satteri-')).sort()
    : [];
  return {
    baselineSha,
    evaluationSha: await commandOutput('git', ['rev-parse', 'HEAD'], worktreeRoot),
    lockfileSha256: await digestFile(lockPath),
    node: process.version,
    npm: await commandOutput('npm', ['--version'], worktreeRoot),
    platform: platform(),
    release: release(),
    arch: arch(),
    cpu: cpus()[0]?.model ?? 'unknown',
    cpuCount: cpus().length,
    nativePackages,
  };
}

async function snapshotOutputs(worktreeRoot, variantModeRoot) {
  const snapshotRoot = join(variantModeRoot, 'snapshot');
  await safeRemoveArtifactTarget(variantModeRoot, snapshotRoot);
  await mkdir(snapshotRoot, { recursive: true });
  for (const relativePath of ['dist', '.vercel/output']) {
    const source = join(worktreeRoot, relativePath);
    if (await pathExists(source)) {
      await cp(source, join(snapshotRoot, relativePath), { recursive: true, force: true });
    }
  }
}

async function main() {
  const { variant, mode, cache, rounds, artifactRoot } = parseArgs(process.argv.slice(2));
  const worktreeRoot = process.cwd();
  const analyzeOnly = process.env.ISSUE_414_ANALYZE_ONLY === 'true';
  const baselineSha =
    process.env.ISSUE_414_BASELINE_SHA ??
    (await commandOutput('git', ['rev-parse', 'origin/main'], worktreeRoot));
  const variantModeRoot = join(artifactRoot, variant, mode);
  const runsRoot = join(variantModeRoot, 'runs');
  await mkdir(runsRoot, { recursive: true });
  await mkdir(join(variantModeRoot, 'screenshots'), { recursive: true });

  const environment = await collectEnvironment(worktreeRoot, baselineSha);
  await writeFile(
    join(variantModeRoot, 'environment.json'),
    `${JSON.stringify(environment, null, 2)}\n`
  );

  const sourcePatch = await run('git', ['diff', '--binary', baselineSha], {
    cwd: worktreeRoot,
    env: process.env,
    capture: true,
  });
  await writeFile(join(artifactRoot, 'source.patch'), sourcePatch.stdout);

  const benchmarkPath = join(variantModeRoot, 'benchmark.jsonl');
  const commandLogPath = join(variantModeRoot, 'commands.log');
  const manifests = [];

  for (let round = 1; round <= (analyzeOnly ? 1 : rounds); round += 1) {
    if (analyzeOnly) {
      const manifest = await collectManifest(worktreeRoot, mode);
      manifests.push(manifest);
      await writeFile(
        join(runsRoot, 'analyze-only-manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`
      );
      break;
    }
    if (cache === 'cold') {
      for (const target of ['dist', '.vercel/output', '.astro', 'node_modules/.astro']) {
        await safeRemoveWorktreeOutput(worktreeRoot, join(worktreeRoot, target));
      }
    }

    const env = {
      ...process.env,
      ISSUE_414_VARIANT: variant,
      ISSUE_414_BASELINE_SHA: baselineSha,
      BASIC_AUTH_ENABLED: mode === 'ssr' ? 'true' : 'false',
    };
    const command = './node_modules/.bin/astro build --force';
    await appendFile(
      commandLogPath,
      `[round ${round}] ISSUE_414_VARIANT=${variant} BASIC_AUTH_ENABLED=${env.BASIC_AUTH_ENABLED} ${command}\n`
    );
    const result = await run('./node_modules/.bin/astro', ['build', '--force'], {
      cwd: worktreeRoot,
      env,
      capture: false,
    });
    const benchmark = {
      variant,
      mode,
      cache,
      round,
      elapsedMs: Math.round(result.elapsedMs * 100) / 100,
      exitCode: result.exitCode,
      signal: result.signal,
    };
    await appendFile(benchmarkPath, `${JSON.stringify(benchmark)}\n`);
    await appendFile(
      commandLogPath,
      `[round ${round}] exit=${result.exitCode} elapsedMs=${benchmark.elapsedMs}\n`
    );
    if (result.exitCode !== 0) throw new Error(`Astro build failed in round ${round}`);

    const manifest = await collectManifest(worktreeRoot, mode);
    manifests.push(manifest);
    await writeFile(
      join(runsRoot, `${String(round).padStart(3, '0')}-manifest.json`),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
  }

  const manifest = manifests.at(-1);
  await writeFile(join(variantModeRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (!analyzeOnly) await snapshotOutputs(worktreeRoot, variantModeRoot);

  const deterministic = manifests.every(
    (candidate) => JSON.stringify(candidate) === JSON.stringify(manifests[0])
  );
  const diffPath = join(variantModeRoot, 'diff.json');
  const previousDiff = (await pathExists(diffPath))
    ? JSON.parse(await readFile(diffPath, 'utf8'))
    : null;
  const selfDeterministic = analyzeOnly
    ? (previousDiff?.selfDeterministic ?? deterministic)
    : deterministic;
  let diff = { pass: selfDeterministic, selfDeterministic, sections: {} };
  if (variant !== 'baseline') {
    const baselinePath = join(artifactRoot, 'baseline', mode, 'manifest.json');
    if (!(await pathExists(baselinePath)))
      throw new Error(`Baseline manifest is missing: ${baselinePath}`);
    diff = {
      ...compareManifests(JSON.parse(await readFile(baselinePath, 'utf8')), manifest),
      selfDeterministic,
    };
    diff.pass = diff.pass && selfDeterministic;
  }
  await writeFile(diffPath, `${JSON.stringify(diff, null, 2)}\n`);

  console.log(
    JSON.stringify({ variant, mode, cache, rounds, analyzeOnly, artifactRoot, diff }, null, 2)
  );
  if (!diff.pass) process.exitCode = 2;
}

await main();
