'use strict';
// R37: keep the R36 output/contract intact and externalize only its main runtime.
// Classic blocking script semantics are intentional: no async/defer/module migration.
require('./assemble-r36.cjs');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'public', 'index.html');
const original = fs.readFileSync(file, 'utf8');
const candidates = [...original.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .filter(match => match[1].includes('function sg3Render(figure)'));
if (candidates.length !== 1) throw new Error('R37 expected exactly one inline main runtime');
const [oldTag, source] = candidates[0];
if (!oldTag.startsWith('<script>') || !source.includes('function render(reselect=false)') ||
    !source.includes('const R15_PLANET_DATA=') || Buffer.byteLength(source, 'utf8') < 1024 * 1024)
  throw new Error('R37 main runtime source identity changed');
new vm.Script(source, { filename: 'sunrise-r37-external-runtime.js' });
const digest = crypto.createHash('sha256').update(source, 'utf8').digest('hex');
const assetName = 'portal-main-' + digest + '.js';
const assetURL = '/assets/r37/' + assetName;
const assetDir = path.join(root, 'public', 'assets', 'r37');
fs.mkdirSync(assetDir, { recursive: true });
const asset = path.join(assetDir, assetName);
const tempAsset = asset + '.tmp';
try {
  fs.writeFileSync(tempAsset, source, 'utf8');
  fs.renameSync(tempAsset, asset);
} finally { if (fs.existsSync(tempAsset)) fs.unlinkSync(tempAsset); }
if (crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex') !== digest)
  throw new Error('R37 asset integrity mismatch');
const preload = '<link rel="preload" as="script" href="' + assetURL + '">';
const script = '<script src="' + assetURL + '"></script>';
if (original.split('</head>').length !== 2) throw new Error('R37 head boundary changed');
let updated = original.replace(oldTag, script).replace('</head>', preload + '</head>');
if ((updated.match(/<template data-route="/g) || []).length !== 34 ||
    (updated.match(/class="r28-workflow" id="workflow"/g) || []).length !== 25 ||
    (updated.match(/class="r35-photo-thumb"/g) || []).length !== 0 ||
    (updated.match(/class="sg3-product-object r04-thumb r35-photo-thumb"/g) || []).length !== 7)
  throw new Error('R37 pre-existing routes, workflows or 7 actual images changed');
if (updated.includes('function sg3Render(figure)') ||
    updated.split(assetURL).length !== 3)
  throw new Error('R37 runtime not replaced exactly once');
const originalBytes = Buffer.byteLength(original, 'utf8');
const htmlBytes = Buffer.byteLength(updated, 'utf8');
if (originalBytes - htmlBytes < 1024 * 1024) throw new Error('R37 insufficient HTML separation');
const tempHtml = path.join(root, 'public', '.index-r37.tmp');
try {
  fs.writeFileSync(tempHtml, updated, 'utf8');
  fs.renameSync(tempHtml, file);
} finally { if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml); }
console.log('R37 HTML: ' + htmlBytes + ' bytes (R36 ' + originalBytes + '; separated ' +
  (originalBytes - htmlBytes) + ', ' + ((1 - htmlBytes / originalBytes) * 100).toFixed(1) + '%).');
console.log('R37 runtime: ' + Buffer.byteLength(source, 'utf8') +
  ' bytes, SHA-256 ' + digest + ', asset ' + assetURL);
console.log('R37: original script order and blocking semantics retained; preloaded immutable URL.');
