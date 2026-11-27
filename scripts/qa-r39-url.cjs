'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.resolve(__dirname, '../source/r39/clean-url.js'), 'utf8');
const root = 'https://sunrise-group.ko-pg.workers.dev';
const state = { route: 'kept' };
const cases = [
  ['/?utm_source=chatgpt.com', '/'],
  ['/?utm_source=chatgpt.com&utm_medium=referral&utm_campaign=x', '/'],
  ['/?UTM_SOURCE=x&utm_source=y&mode=demo#/projects/cleaner', '/?mode=demo#/projects/cleaner'],
  ['/?utm_source=x&mode=demo&mode=other#/programs', '/?mode=demo&mode=other#/programs'],
  ['/?mode=demo#/programs', null],
  ['/#/programs', null],
  ['/?custom_utm_source=x&utm_unknown=y', null],
  ['/index.html?utm_source=x#purpose', '/index.html#purpose']
];
for (const [input, expected] of cases) {
  const calls = [];
  vm.runInNewContext(code, {URL, location:{href:root+input}, history:{state,replaceState:(...args)=>calls.push(args)}});
  if (expected === null) assert.equal(calls.length, 0, input);
  else { assert.equal(calls.length, 1, input); assert.equal(calls[0][0], state); assert.equal(calls[0][2],expected,input); }
}
const html = fs.readFileSync(path.resolve(__dirname, '../public/index.html'),'utf8');
assert.equal(html.split('id="sunrise-clean-url"').length,2);
assert.equal((html.match(/<template data-route="/g)||[]).length,34);
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25);
assert.ok(html.includes('/assets/r38/'));
console.log('R39 URL cleanup: 8/8 cases; source injection and R38 route/workflow contract PASS');
