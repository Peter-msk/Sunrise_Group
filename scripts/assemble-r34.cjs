'use strict';
// Final source-first release: previous R33 source build -> R34 editable source overlay.
// public/index.html is deployment output only and must remain untracked by Git.
require('./assemble-r33.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'public','index.html');
const {finishHomepage}=require('../source/r34/home-polish.cjs');
const old=fs.readFileSync(output,'utf8');
let html=finishHomepage(old);
const styles=fs.readFileSync(path.join(root,'source','r34','polish.css'),'utf8');
if(/<\/style/i.test(styles))throw new Error('R34 CSS cannot contain closing style tags');
const styleHook='<style id="sunrise-r33-home">';
const start=html.indexOf(styleHook);
const end=start>=0?html.indexOf('</style>',start):-1;
if(start<0||end<0)throw new Error('R34 prior source stylesheet contract missing');
html=html.slice(0,end+8)+'<style id="sunrise-r34-home">'+styles+'</style>'+html.slice(end+8);
const times=(pattern)=>(html.match(pattern)||[]).length;
if(times(/<template data-route="/g)!==34)throw new Error('R34 existing route count changed');
if(times(/class="r28-workflow" id="workflow"/g)!==25)throw new Error('R34 detail workflows changed');
if(times(/class="r31-workflow-jump"/g)!==25)throw new Error('R34 detail shortcuts changed');
if(times(/class="r32-domain /g)!==2)throw new Error('R34 two A+B+D product domains changed');
if(times(/<meta property="og:title"/g)!==1)throw new Error('R34 social metadata duplicated');
if(times(/<meta property="og:description"/g)!==1)throw new Error('R34 description metadata duplicated');
const tmp=path.join(root,'public','.index-r34.tmp');
try{fs.writeFileSync(tmp,html,'utf8');fs.renameSync(tmp,output);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
const digest=crypto.createHash('sha256').update(html,'utf8').digest('hex');
console.log('R34 source-first final HTML generated (NOT committed): '+Buffer.byteLength(html,'utf8')+' bytes, SHA-256 '+digest);
console.log('Release contracts: 34 routes, 25 workflows, 2 product domains, 3D solar retained.');
