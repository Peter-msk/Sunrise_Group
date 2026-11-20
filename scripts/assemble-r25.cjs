'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'source', 'r25');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const bytes = Buffer.concat(manifest.parts.map(name => fs.readFileSync(path.join(dir, name))));
const digest = crypto.createHash('sha256').update(bytes).digest('hex');
if (bytes.length !== manifest.bytes || digest !== manifest.sha256) {
  throw new Error('R25 integrity check failed: ' + bytes.length + ' bytes / ' + digest);
}
const html = bytes.toString('utf8');
if (!/^\s*<!doctype html>/i.test(html) || !/<\/html>\s*$/i.test(html)) {
  throw new Error('Invalid website entry');
}
const output = path.join(root, 'public', 'index.html');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, bytes);
console.log(manifest.version + ' website entry validated: ' + bytes.length + ' bytes; SHA-256 ' + digest);
