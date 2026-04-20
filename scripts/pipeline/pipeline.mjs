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
import { isDirectRun } from '../lib/cli.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const PIPELINE_DIR = path.join(SCRIPTS_DIR, 'pipeline');
const DEFAULT_CHECKPOINT_PATH = path.join(SCRIPTS_DIR, '.checkpoint');
export const PIPELINE_STEPS = ['url_collect', 'placeholders', 'fetch', 'prepare_llm', 'apply_llm'];

/** @typedef {{ completed_phase?: string, completed_at?: string, next_phase?: string | null, step?: string, mode?: string, section?: string | null }} CheckpointData */

/**
 * Parse CLI arguments.
 * @param {string[]} argv
 * @returns {{ mode: string, section: string | null, resume: boolean }}
 */
export function parseArgs(argv) {
  const modeFlag = argv.find((a) => a.startsWith('--mode='));
  const mode = modeFlag ? modeFlag.split('=')[1] : 'diff';
  const section =
    argv
      .find((a) => a.startsWith('--section='))
      ?.split('=')
      .slice(1)
      .join('=') ?? null;
  const resume = !argv.includes('--no-resume');

  return { mode, section, resume };
}

/**
 * Load checkpoint from file. Returns null if file does not exist.
 * @param {string} checkpointPath
 * @returns {CheckpointData | null}
 */
export function loadCheckpoint(checkpointPath) {
  if (!fs.existsSync(checkpointPath)) return null;
  const raw = fs.readFileSync(checkpointPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    console.warn(
      `Invalid checkpoint at ${checkpointPath}; ignoring and restarting pipeline. ${error.message}`
    );
    return null;
  }
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

export function getPendingSteps(checkpoint, { resume = true, mode = 'diff', section = null } = {}) {
  if (!resume || !checkpoint) return [...PIPELINE_STEPS];
  if ((checkpoint.mode ?? 'diff') !== mode) return [...PIPELINE_STEPS];
  if ((checkpoint.section ?? null) !== section) return [...PIPELINE_STEPS];
  if (!checkpoint.step) return [...PIPELINE_STEPS];

  const stepName = checkpoint.step.replace(/_done$/, '');
  const index = PIPELINE_STEPS.indexOf(stepName);
  if (index === -1) return [...PIPELINE_STEPS];
  return PIPELINE_STEPS.slice(index + 1);
}

function runProcess(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(PIPELINE_DIR, script), ...args], {
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
  const { mode, section, resume } = parseArgs(args);

  const checkpointPath = DEFAULT_CHECKPOINT_PATH;
  const checkpoint = loadCheckpoint(checkpointPath);
  const pendingSteps = getPendingSteps(checkpoint, { resume, mode, section });
  const modeArgs = [`--mode=${mode}`];
  const sectionArgs = section ? [`--section=${section}`] : [];

  await saveCheckpoint(checkpointPath, {
    ...(checkpoint ?? {}),
    mode,
    section,
  });

  const stepHandlers = {
    url_collect: async () => {
      const code = await runProcess('update_sidebar_urls_from_live.mjs', []);
      if (code !== 0) {
        console.error('url_collect step failed. Aborting pipeline.');
        process.exit(code);
      }
    },
    placeholders: async () => {
      if (mode !== 'full') return;
      const code = await runProcess('generate_untranslated_placeholders.mjs', sectionArgs);
      if (code !== 0) {
        console.error('placeholders step failed. Aborting pipeline.');
        process.exit(code);
      }
    },
    fetch: async () => {
      const code = await runProcess('fetch_translate_images.mjs', [...modeArgs, ...sectionArgs]);
      if (code !== 0) {
        console.error('fetch step failed. Aborting pipeline.');
        process.exit(code);
      }
    },
    prepare_llm: async () => {
      const code = await runProcess('prepare_llm_tasks.mjs', sectionArgs);
      if (code !== 0) {
        console.error('prepare_llm step failed. Aborting pipeline.');
        process.exit(code);
      }
    },
    apply_llm: async () => {
      const code = await runProcess('apply_llm_translations.mjs', sectionArgs);
      if (code !== 0) {
        console.error('apply_llm step failed. Aborting pipeline.');
        process.exit(code);
      }
    },
  };

  for (const step of pendingSteps) {
    await runStep(step, stepHandlers[step], checkpointPath);
  }

  await saveCheckpoint(checkpointPath, {
    completed_phase: 'PR-final',
    completed_at: new Date().toISOString(),
    next_phase: null,
    step: 'apply_llm_done',
    mode,
    section,
  });

  console.log('\n✅ Pipeline complete.');
}

if (isDirectRun(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
