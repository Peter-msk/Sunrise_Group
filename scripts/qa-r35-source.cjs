'use strict';
// GitHub must retain edit-ready source screenshots; deploy HTML and copied assets only after build.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const git=(args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean).map(x=>x.replace(/\\/g,'/'));
assert.equal(tracked.filter(p=>/\.html?$/i.test(p)).length,0,'generated HTML may not be tracked');
assert.equal(tracked.filter(p=>p.startsWith('public/')).length,0,'generated public output may not be tracked');
assert.equal(git(['check-ignore','--no-index','public/index.html']),'public/index.html','public HTML ignored');
const list=JSON.parse(fs.readFileSync(path.join(root,'source','r35','screenshots.json'),'utf8')).screenshots;
assert.equal(list.length,7,'seven user captures');
for(const m of list){
 const source='source/r35/screenshots/'+m.file;
 assert.ok(tracked.includes(source),'screenshots are source-owned Git blobs: '+source);
 const buf=fs.readFileSync(path.join(root,source));
 assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),m.sha256,'screenshot hash '+source);
 const output=path.join(root,'public','assets','r35',m.file);
 assert.ok(fs.existsSync(output),'built static asset '+m.file);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),m.sha256,'public bytes preserved '+m.file);
}
assert.ok(tracked.includes('scripts/assemble-r35.cjs')&&tracked.includes('source/r35/polish.css'),'source-first final overlay');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(pkg.scripts.build,'node scripts/assemble-r35.cjs','latest deploy built only from source');
const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'34 routes');
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25,'25 workflows');
console.log('R35 SOURCE GATE PASS: 7 actual photos tracked in source/r35/screenshots, 0 tracked HTML/public artifacts, 7 verified deploy assets.');
