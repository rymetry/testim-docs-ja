import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetDirectory = path.join(root, 'public/fonts/noto-sans-jp');
const manifest = JSON.parse(fs.readFileSync(path.join(assetDirectory, 'SOURCE.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'src/styles/noto-sans-jp.css'), 'utf8');
const snapshot = fs.readFileSync(path.join(root, 'docs/font-sources/noto-sans-jp-google-v56.css'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const normalizeUnicodeRange = (value) => value.replace(/\s+/g, ' ').trim();
const facePattern = (source) => [
  ...source.matchAll(
    /@font-face\s*\{\s*font-family:\s*'Noto Sans JP';\s*font-style:\s*normal;\s*font-weight:\s*(?<weight>[^;]+);\s*font-display:\s*swap;\s*src:\s*url\((?<url>[^)]+)\)\s*format\('woff2'\);\s*unicode-range:\s*(?<unicodeRange>[^;]+);\s*\}/g
  ),
];
const snapshotFaces = facePattern(snapshot.toString()).map(({ groups }) => ({
  file: path.basename(groups.url),
  sourceUrl: groups.url,
  unicodeRange: normalizeUnicodeRange(groups.unicodeRange),
  weight: groups.weight,
}));
const localCssFaces = facePattern(css).map(({ groups }) => ({
  path: groups.url.replace(/^'\/fonts\/noto-sans-jp\//, '').replace(/'$/, ''),
  unicodeRange: normalizeUnicodeRange(groups.unicodeRange),
  weight: groups.weight,
}));

describe('vendored Noto Sans JP assets', () => {
  it('keeps the Google Fonts snapshot, CSS, and assets auditable', () => {
    assert.equal(manifest.family, 'Noto Sans JP');
    assert.equal(manifest.version, 'v56');
    assert.equal(manifest.slices, 124);
    assert.equal(manifest.files.length, manifest.slices);
    assert.equal(manifest.providerSnapshot.sha256, sha256(snapshot));
    assert.match(manifest.providerSnapshot.cssUrl, /^https:\/\/fonts\.googleapis\.com\//);
    assert.deepEqual(
      manifest.files.map(({ file, sourceUrl, unicodeRange, weight }) => ({
        file,
        sourceUrl,
        unicodeRange: normalizeUnicodeRange(unicodeRange),
        weight,
      })),
      snapshotFaces
    );

    const files = new Set();
    for (const asset of manifest.files) {
      assert.equal(files.has(asset.file), false, `duplicate asset: ${asset.file}`);
      files.add(asset.file);
      assert.equal(asset.path, `${manifest.version}/${asset.file}`);
      assert.equal(sha256(fs.readFileSync(path.join(assetDirectory, asset.path))), asset.sha256);
    }
    assert.deepEqual(
      localCssFaces,
      manifest.files.map(({ path: assetPath, unicodeRange, weight }) => ({
        path: assetPath,
        unicodeRange: normalizeUnicodeRange(unicodeRange),
        weight,
      }))
    );
  });
});
