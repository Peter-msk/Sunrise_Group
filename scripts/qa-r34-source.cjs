'use strict';
// Run in GitHub Actions or developer Git clone. Deployment HTML must be generated,
// not present in the repository's Git tree. Never delete user files.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const git=(args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean).map(x=>x.replace(/\\/g,'/'));
const generatedPaths=tracked.filter(p=>/(^|\/)(?:dist|build|\.cloudflare)\//i.test(p)||/^public\/index\.html$/i.test(p)||/^public\/assets\/r28\//i.test(p)||/\.html?$/i.test(p));
assert.deepEqual(generatedPaths,[],'Git must only contain editable sources, never generated HTML or derived assets');
const ignored=git(['check-ignore','--no-index','public/index.html']);
assert.equal(ignored,'public/index.html','generated HTML must be gitignored');
assert.ok(tracked.includes('source/r34/home-polish.cjs'),'final edited markup logic belongs in JavaScript source/');
assert.ok(tracked.includes('source/r34/polish.css'),'final visual rules belong in CSS source/');
assert.ok(tracked.includes('scripts/assemble-r34.cjs'),'site is compiled from JS sources');
assert.ok(tracked.includes('cloudflare.config.ts'),'Cloudflare deploy configuration remains source-managed');
const packageJSON=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(packageJSON.scripts.build,'node scripts/assemble-r34.cjs','build entry selects the final source');
const config=fs.readFileSync(path.join(root,'cloudflare.config.ts'),'utf8');
assert.ok(config.includes('sg-portal-8e4c71b9'),'only designated production Worker configured');
const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
assert.ok(html.startsWith('<!DOCTYPE html>')||html.startsWith('<!doctype html>'),'deployment output is valid HTML');
assert.ok(html.includes('id="sunrise-r34-home"'),'R34 styles generated');
assert.ok(html.includes('property="og:description"'),'accurate description generated from JS source');
assert.ok(html.includes('class="r32-solar-tools"'),'3D controls contract');
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'34 source-driven routes');
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25,'25 product details');
assert.equal((html.match(/class="r31-workflow-jump"/g)||[]).length,25,'25 workflow shortcuts');
console.log('R34 SOURCE-ONLY gate PASS: '+tracked.length+' Git-tracked source/config/doc paths, zero tracked .html or generated assets; production HTML generated on build.');
