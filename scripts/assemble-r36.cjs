'use strict';
// R36 performance-only overlay: leave R25-R35 source and product contracts immutable.
require('./assemble-r35.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'public','index.html');
const before=fs.readFileSync(output,'utf8');
// R28 introduces IntersectionObserver, but its unconditional rAF preload still
// fetches all nine planet textures even when the solar scene is off-screen.
const eager='sync();resize();paint();schedule();requestAnimationFrame(preloadPlanetTextures);';
const lazy='sync();resize();paint();schedule();';
const count=before.split(eager).length-1;
if(count!==1)throw new Error('R36 solar initial-preload contract changed: '+count);
const html=before.replace(eager,lazy);
if(!html.includes("if(visible){preloadPlanetTextures();requestPaint();schedule();}"))
 throw new Error('R36 solar visibility-triggered loading guard missing');
const main=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)]
 .filter(x=>x[1].includes('function sg3Render(figure)'));
if(main.length!==1)throw new Error('R36 solar renderer count changed');
new vm.Script(main[0][1],{filename:'sunrise-r36-render.js'});
const times=re=>(html.match(re)||[]).length;
if(times(/<template data-route="/g)!==34||times(/class="r28-workflow" id="workflow"/g)!==25||
   times(/class="r31-workflow-jump"/g)!==25||times(/class="r32-solar-tools"/g)!==1||
   times(/class="sg3-product-object r04-thumb r35-photo-thumb"/g)!==7)
 throw new Error('R36 unchanged navigation/products/solar/photo contract failed');
const staging=path.join(root,'public','.index-r36.tmp');
try{fs.writeFileSync(staging,html,'utf8');fs.renameSync(staging,output);}
finally{if(fs.existsSync(staging))fs.unlinkSync(staging);}
console.log('R36 PERFORMANCE: removed unconditional 9-texture preload; solar IntersectionObserver remains the only initial trigger.');
console.log('R36 HTML: '+Buffer.byteLength(html)+' bytes; sha256 '+crypto.createHash('sha256').update(html).digest('hex'));
