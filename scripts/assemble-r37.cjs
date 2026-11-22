'use strict';
// Externalize the R36 main runtime with its original script execution order.
// Classic blocking script semantics are intentional: no async/defer/module migration.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function assembleRuntime(revision, transform = source => source) {
  require('./assemble-r36.cjs');
  const file = path.join(root, 'public', 'index.html');
  const original = fs.readFileSync(file, 'utf8');
  const candidates = [...original.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .filter(match => match[1].includes('function sg3Render(figure)'));
  if (candidates.length !== 1) throw new Error(revision.toUpperCase() + ' expected exactly one inline main runtime');
  const [oldTag, originalSource] = candidates[0];
  if (!oldTag.startsWith('<script>') || !originalSource.includes('function render(reselect=false)') ||
      !originalSource.includes('const R15_PLANET_DATA=') || Buffer.byteLength(originalSource, 'utf8') < 1024 * 1024)
    throw new Error(revision.toUpperCase() + ' main runtime source identity changed');
  const source = transform(originalSource, original);
  new vm.Script(source, { filename: 'sunrise-' + revision + '-external-runtime.js' });
  const digest = crypto.createHash('sha256').update(source, 'utf8').digest('hex');
  const assetName = 'portal-main-' + digest + '.js';
  const assetURL = '/assets/' + revision + '/' + assetName;
  const assetDir = path.join(root, 'public', 'assets', revision);
  fs.mkdirSync(assetDir, { recursive: true });
  const asset = path.join(assetDir, assetName);
  const tempAsset = asset + '.tmp';
  try {
    fs.writeFileSync(tempAsset, source, 'utf8');
    fs.renameSync(tempAsset, asset);
  } finally { if (fs.existsSync(tempAsset)) fs.unlinkSync(tempAsset); }
  if (crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex') !== digest)
    throw new Error(revision.toUpperCase() + ' asset integrity mismatch');
  const preload = '<link rel="preload" as="script" href="' + assetURL + '">';
  const script = '<script src="' + assetURL + '"></script>';
  if (original.split('</head>').length !== 2) throw new Error(revision.toUpperCase() + ' head boundary changed');
  const updated = original.replace(oldTag, script).replace('</head>', preload + '</head>');
  if ((updated.match(/<template data-route="/g) || []).length !== 34 ||
      (updated.match(/class="r28-workflow" id="workflow"/g) || []).length !== 25 ||
      (updated.match(/class="r35-photo-thumb"/g) || []).length !== 0 ||
      (updated.match(/class="sg3-product-object r04-thumb r35-photo-thumb"/g) || []).length !== 7)
    throw new Error(revision.toUpperCase() + ' pre-existing routes, workflows or 7 actual images changed');
  if (updated.includes('function sg3Render(figure)') ||
      updated.split(assetURL).length !== 3)
    throw new Error(revision.toUpperCase() + ' runtime not replaced exactly once');
  const originalBytes = Buffer.byteLength(original, 'utf8');
  const htmlBytes = Buffer.byteLength(updated, 'utf8');
  if (originalBytes - htmlBytes < 1024 * 1024) throw new Error(revision.toUpperCase() + ' insufficient HTML separation');
  const tempHtml = path.join(root, 'public', '.index-' + revision + '.tmp');
  try {
    fs.writeFileSync(tempHtml, updated, 'utf8');
    fs.renameSync(tempHtml, file);
  } finally { if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml); }
  console.log(revision.toUpperCase() + ' HTML: ' + htmlBytes + ' bytes (R36 ' + originalBytes + '; separated ' +
    (originalBytes - htmlBytes) + ', ' + ((1 - htmlBytes / originalBytes) * 100).toFixed(1) + '%).');
  console.log(revision.toUpperCase() + ' runtime: ' + Buffer.byteLength(source, 'utf8') +
    ' bytes, SHA-256 ' + digest + ', asset ' + assetURL);
  console.log(revision.toUpperCase() + ': original script order and blocking semantics retained; preloaded immutable URL.');
}

if (require.main === module) assembleRuntime('r37');
module.exports = assembleRuntime;
