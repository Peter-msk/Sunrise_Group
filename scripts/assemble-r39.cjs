'use strict';
require('./assemble-r38.cjs');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const output = path.resolve(__dirname, '../public/index.html');
const script = fs.readFileSync(path.resolve(__dirname, '../source/r39/clean-url.js'), 'utf8');
new vm.Script(script);
const html = fs.readFileSync(output, 'utf8');
if (html.split('</head>').length !== 2 || html.includes('id="sunrise-clean-url"')) throw new Error('R39 head boundary changed');
const updated = html.replace('</head>', '<script id="sunrise-clean-url">' + script + '</script></head>');
const tmp = output + '.r39.tmp';
try { fs.writeFileSync(tmp, updated); fs.renameSync(tmp, output); }
finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
console.log('R39 URL cleanup installed; R38 source and assets retained.');
