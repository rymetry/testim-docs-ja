/**
 * pipeline.mjs — Orchestration entry point for the Testim Docs JA pipeline
 *
 * Usage:
 *   node scripts/pipeline.mjs [--mode=full|diff]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const DEFAULT_CHECKPOINT_PATH = path.join(SCRIPTS_DIR, '.checkpoint');

/** @typedef {{ completed_phase?: string, completed_at?: string, next_phase?: string, step?: string, mode?: string }} CheckpointData */

/**
 * Parse CLI arguments.
 * @param {string[]} argv
 * @returns {{ mode: string }}
 */
export function parseArgs(argv) {
  const modeFlag = argv.find((a) => a.startsWith('--mode='));
  const mode = modeFlag ? modeFlag.split('=')[1] : 'diff';

  return { mode };
}

/**
 * Load checkpoint from file. Returns null if file does not exist.
 * @param {string} checkpointPath
 * @returns {CheckpointData | null}
 */
export function loadCheckpoint(checkpointPath) {
  if (!fs.existsSync(checkpointPath)) return null;
  return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
}

/**
 * Save checkpoint data to file (creates parent directories as needed).
 * @param {string} checkpointPath
 * @param {CheckpointData} data
 * @returns {Promise<void>}
 */
export async function saveCheckpoint(checkpointPath, data) {
  fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
  await fs.promises.writeFile(checkpointPath, JSON.stringify(data, null, 2), 'utf8');
}

function runProcess(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(SCRIPTS_DIR, script), ...args], {
      stdio: 'inherit',
      cwd: ROOT,
    });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', reject);
  });
}

async function runStep(name, fn, checkpointPath) {
  console.log(`\n▶ Step: ${name}`);
  await fn();
  const existing = loadCheckpoint(checkpointPath) ?? {};
  await saveCheckpoint(checkpointPath, { ...existing, step: `${name}_done` });
}

async function main() {
  const args = process.argv.slice(2);
  const { mode } = parseArgs(args);

  const checkpointPath = DEFAULT_CHECKPOINT_PATH;

  const modeArgs = [`--mode=${mode}`];

  await runStep('url_collect', async () => {
    const code = await runProcess('update_sidebar_urls_from_live.mjs', []);
    if (code !== 0) {
      console.error('url_collect step failed. Aborting pipeline.');
      process.exit(code);
    }
  }, checkpointPath);

  await runStep('fetch', async () => {
    const code = await runProcess('fetch_translate_images.mjs', modeArgs);
    if (code !== 0) {
      console.error('fetch step failed. Aborting pipeline.');
      process.exit(code);
    }
  }, checkpointPath);

  await runStep('prepare_llm', async () => {
    const code = await runProcess('prepare_llm_tasks.mjs', []);
    if (code !== 0) {
      console.error('prepare_llm step failed. Aborting pipeline.');
      process.exit(code);
    }
  }, checkpointPath);

  await runStep('apply_llm', async () => {
    const code = await runProcess('apply_llm_translations.mjs', []);
    if (code !== 0) {
      console.error('apply_llm step failed. Aborting pipeline.');
      process.exit(code);
    }
  }, checkpointPath);

  await saveCheckpoint(checkpointPath, {
    completed_phase: 'PR-0a',
    completed_at: new Date().toISOString(),
    next_phase: 'PR-0b',
    step: 'apply_llm_done',
    mode,
  });

  console.log('\n✅ Pipeline complete.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
