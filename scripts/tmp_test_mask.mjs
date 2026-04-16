import { classifySegment, maskSegmentText, __clearCaches } from './lib/parity_glossary_mask.mjs';
__clearCaches();
const t = 'a. + params をクリック\\ b. js parameter — ドロップダウンを js にして javascript パラメーターを入力\\ c. package parameter — ドロップダウンを package にして npm パッケージ変数を入力';
const r = classifySegment(t);
console.log('isFullyMasked:', r.isFullyMasked);
console.log('residue:', r.residue);
const { maskedText } = maskSegmentText(t);
console.log('masked:', maskedText);
