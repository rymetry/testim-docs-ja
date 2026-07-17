import { defineConfig } from 'astro/config';

const mode = process.env.ISSUE_414_COMPRESS_HTML;

if (mode !== 'true' && mode !== 'jsx') {
  throw new Error('ISSUE_414_COMPRESS_HTML must be true or jsx');
}

export default defineConfig({
  compressHTML: mode === 'jsx' ? 'jsx' : true,
});
