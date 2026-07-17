#!/usr/bin/env node

import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

const VARIANTS = ['baseline', 'satteri', 'jsx'];
const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
};
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--artifact-root') {
    throw new Error(
      'Usage: node scripts/compare-astro-defaults-visual.mjs --artifact-root <absolute-path>'
    );
  }
  const artifactRoot = resolve(argv[1]);
  if (artifactRoot !== argv[1]) throw new Error('--artifact-root must be absolute');
  return artifactRoot;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function serve(root) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requested = decodeURIComponent(url.pathname);
      const relativePath = requested.endsWith('/') ? `${requested}index.html` : requested;
      const filePath = normalize(join(root, relativePath));
      if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
        response.writeHead(400).end('Bad request');
        return;
      }
      if (!(await exists(filePath))) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, {
        'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolvePromise({
        server,
        origin: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function representativeRoutes(manifest) {
  const docs = manifest.documents.filter((document) => document.route.startsWith('/docs/'));
  const selected = new Set(['/']);
  for (const predicate of [
    (document) => document.callouts.length > 0,
    (document) => document.tables.length > 0,
    (document) => document.expressiveCode.length > 0,
    (document) => document.images.length > 0,
    (document) => document.headings.some((heading) => heading.id && /[^a-z0-9-]/i.test(heading.id)),
  ]) {
    const match = docs.find(predicate);
    if (match) selected.add(match.route);
  }
  return [...selected];
}

async function pixelDiff(baselinePath, candidatePath, outputPath) {
  const baselineMetadata = await sharp(baselinePath).metadata();
  const candidateMetadata = await sharp(candidatePath).metadata();
  const width = Math.max(baselineMetadata.width, candidateMetadata.width);
  const height = Math.max(baselineMetadata.height, candidateMetadata.height);
  const normalizeDimensions = (path, metadata) =>
    sharp(path)
      .ensureAlpha()
      .extend({
        right: width - metadata.width,
        bottom: height - metadata.height,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
  const baseline = await normalizeDimensions(baselinePath, baselineMetadata);
  const candidate = await normalizeDimensions(candidatePath, candidateMetadata);
  const output = Buffer.alloc(baseline.data.length);
  let differentPixels = 0;
  for (let index = 0; index < baseline.data.length; index += 4) {
    const differs =
      baseline.data[index] !== candidate.data[index] ||
      baseline.data[index + 1] !== candidate.data[index + 1] ||
      baseline.data[index + 2] !== candidate.data[index + 2] ||
      baseline.data[index + 3] !== candidate.data[index + 3];
    if (differs) differentPixels += 1;
    output[index] = differs ? 255 : 255;
    output[index + 1] = differs ? 0 : 255;
    output[index + 2] = differs ? 0 : 255;
    output[index + 3] = differs ? 255 : 0;
  }
  await sharp(output, {
    raw: {
      width: baseline.info.width,
      height: baseline.info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);
  return differentPixels;
}

const artifactRoot = parseArgs(process.argv.slice(2));
const manifest = JSON.parse(
  await readFile(join(artifactRoot, 'baseline/static/manifest.json'), 'utf8')
);
const routeSet = new Set(representativeRoutes(manifest));
for (const candidate of ['satteri', 'jsx']) {
  const diffPath = join(artifactRoot, candidate, 'static/diff.json');
  if (!(await exists(diffPath))) continue;
  const diff = JSON.parse(await readFile(diffPath, 'utf8'));
  for (const document of diff.diffIndex?.documents ?? []) routeSet.add(document.route);
}
const routes = [...routeSet];
const servers = {};
for (const variant of VARIANTS) {
  const root = join(artifactRoot, variant, 'static/snapshot/dist');
  if (!(await exists(root))) throw new Error(`Missing static snapshot: ${root}`);
  servers[variant] = await serve(root);
  await mkdir(join(artifactRoot, variant, 'static/screenshots'), { recursive: true });
}

const browser = await chromium.launch({ headless: true });
const captures = [];
try {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage({ viewport });
    for (const route of routes) {
      const slug = route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replaceAll('/', '__');
      for (const variant of VARIANTS) {
        await page.goto(`${servers[variant].origin}${route}`, { waitUntil: 'networkidle' });
        await page.addStyleTag({
          content:
            '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
        });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            [...document.images].map((image) =>
              image.complete
                ? image.decode().catch(() => {})
                : new Promise((resolveImage) => {
                    image.addEventListener('load', resolveImage, { once: true });
                    image.addEventListener('error', resolveImage, { once: true });
                  })
            )
          );
        });
        const path = join(
          artifactRoot,
          variant,
          'static/screenshots',
          `${viewportName}__${slug}.png`
        );
        await page.screenshot({ path, fullPage: true, animations: 'disabled' });
        captures.push({ variant, route, viewport: viewportName, path });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  await Promise.all(
    Object.values(servers).map(
      ({ server }) => new Promise((resolveServer) => server.close(resolveServer))
    )
  );
}

const comparisons = [];
for (const candidate of ['satteri', 'jsx']) {
  for (const baseline of captures.filter((capture) => capture.variant === 'baseline')) {
    const candidateCapture = captures.find(
      (capture) =>
        capture.variant === candidate &&
        capture.route === baseline.route &&
        capture.viewport === baseline.viewport
    );
    const outputPath = join(
      artifactRoot,
      `${candidate}-vs-baseline__${baseline.viewport}__${baseline.route === '/' ? 'home' : baseline.route.replace(/^\/+|\/+$/g, '').replaceAll('/', '__')}.png`
    );
    const differentPixels = await pixelDiff(baseline.path, candidateCapture.path, outputPath);
    comparisons.push({
      candidate,
      route: baseline.route,
      viewport: baseline.viewport,
      differentPixels,
      outputPath,
      pass: differentPixels === 0,
    });
  }
}

const summary = { pass: comparisons.every((comparison) => comparison.pass), routes, comparisons };
await writeFile(join(artifactRoot, 'visual-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exitCode = 2;
