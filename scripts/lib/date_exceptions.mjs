import fs from 'node:fs';
import path from 'node:path';

import { ROOT_DIR } from './project.mjs';

export const DATE_EXCEPTIONS_PATH = path.join(
  ROOT_DIR,
  'scripts',
  'config',
  'date-exceptions.json',
);

export function loadDateExceptions(filePath = DATE_EXCEPTIONS_PATH) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function getDateException(exceptions, relativePath) {
  return exceptions?.[relativePath] ?? null;
}

