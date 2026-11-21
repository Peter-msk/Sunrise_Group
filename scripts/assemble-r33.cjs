'use strict';
// R33: refinement of R32 home UX only. The R25-R32 release chain remains immutable.
require('./assemble-r32.cjs');
const fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..');
const file=path.join(base,'public','index.html');
let html=fs.readFileSync(file,'utf8');
function requireOne(text,needle,label){if(text.split(needle).length!==2)throw new Error('R33 expected one '+label)}
const marker='<template data-route="/">',start=html.indexOf(marker);
const end=start<0?-1:html.indexOf('</template>',start);
if(start<0||end<start)throw new Error('R33 missing home route');
let home=html.slice(start,end+'</template>'.length);
const replacements=[
 ['class="r32-hero-primary" href="#/programs"','class="r32-hero-primary" href="#/#solutions"','direct product discovery hero CTA'],
 ['href="#/#solutions">솔루션 분야 보기','href="#/#purpose">개발 원칙 보기','remove repeated solution CTA']
];
for(const [old,next,label] of replacements){
 requireOne(home,old,label);
 home=home.replace(old,next);
}
const catalogueStrip='<div class="r33-catalogue-strip"><p>두 분야를 한곳에서 비교하려면 전체 제품 안내를 이용하세요.</p><a href="#/programs">전체 제품 목록 보기 <span aria-hidden="true">↗</span></a></div>';
const insertAt='</div></section><section class="r32-ethos r19-values-section"';
requireOne(home,insertAt,'solutions section boundary');
home=home.replace(insertAt,'</div>'+catalogueStrip+'</section><section class="r32-ethos r19-values-section"');
if(!home.includes('id="solutions"')||!home.includes('id="purpose"'))throw new Error('R33 deep links removed');
if((home.match(/class="r32-domain /g)||[]).length!==2)throw new Error('R33 product regions changed');
if((home.match(/class="r23-stage"/g)||[]).length!==1)throw new Error('R33 solar structure changed');
if((home.match(/class="r27-solar-controls"/g)||[]).length!==1)throw new Error('R33 solar control structure changed');
html=html.slice(0,start)+home+html.slice(end+'</template>'.length);
const css=fs.readFileSync(path.join(base,'source','r33','polish.css'),'utf8');
if(/<\/style/i.test(css))throw new Error('R33 invalid CSS content');
const previous='<style id="sunrise-r32-home">',cssStart=html.indexOf(previous),cssEnd=cssStart<0?-1:html.indexOf('</style>',cssStart);
if(cssStart<0||cssEnd<0)throw new Error('R33 R32 stylesheet owner absent');
html=html.slice(0,cssEnd+8)+'<style id="sunrise-r33-home">'+css+'</style>'+html.slice(cssEnd+8);
const count=x=>(html.match(x)||[]).length;
if(count(/<template data-route="/g)!==34)throw new Error('R33 route regression');
if(count(/class="r28-workflow" id="workflow"/g)!==25||count(/class="r31-workflow-jump"/g)!==25)throw new Error('R33 detail regression');
if(count(/<a class="catalog-line[^"]*" href="#\/projects\//g)!==25)throw new Error('R33 product catalogue regression');
if(count(/class="r33-catalogue-strip"/g)!==1)throw new Error('R33 overview CTA must be unique');
if(count(/class="r32-hero-primary" href="#\/#solutions"/g)!==1)throw new Error('R33 home CTA');
if(count(/data-design-axis="[BD]"/g)!==4)throw new Error('R33 B/D contract');
fs.writeFileSync(file,html,'utf8');
console.log('R33: hero directly opens home B/D products; footer goes to design principles; full catalogue is separately accessible; 34 routes / 25 details unchanged. HTML '+Buffer.byteLength(html)+' bytes');
