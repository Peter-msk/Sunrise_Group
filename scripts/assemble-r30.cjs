'use strict';
// R30 additive polish of R29: portal consistency, readable rhythm and family-specific continuity.
require('./assemble-r29.cjs');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const output=path.join(root,'public','index.html');
let html=fs.readFileSync(output,'utf8');
function check(ok,desc){if(!ok)throw new Error('R30 contract: '+desc)}
function exactlyOne(before,needle,after,why){
  check(before.split(needle).length===2,why||'unique marker: '+needle.slice(0,75));
  return before.replace(needle,after);
}
function patchRoute(route,mutate){
  const marker='<template data-route="'+route+'">';
  const i=html.indexOf(marker);
  const j=i<0?-1:html.indexOf('</template>',i);
  check(i>=0&&j>i,'missing '+route);
  const old=html.slice(i,j+'</template>'.length);
  const next=mutate(old);
  check(next.startsWith(marker)&&next.endsWith('</template>'),'route integrity '+route);
  html=html.slice(0,i)+next+html.slice(j+'</template>'.length);
}
// The overview page was still advertising QGIS 10 / complete 7 after R28's owned-only catalogue became 9 / complete 6.
patchRoute('/programs',old=>{
  let s=old;
  s=exactlyOne(s,'<b>10개 플러그인 · 개발 완료 7개 · 개발 중 3개 →</b>','<b>9개 플러그인 · 개발 완료 6개 · 개발 중 3개 →</b>','obsolete QGIS overview status');
  s=exactlyOne(s,'<b>프로그램 13개 · 확인 중 3개 →</b>','<b>전체 16개 제품 · 상태 확인 중 3개 →</b>','PC catalogue quantity wording');
  s=exactlyOne(s,'<a class="r05-portal" href="#/programs/pc">','<a class="r05-portal r30-portal-pc" data-design-axis="B" href="#/programs/pc">','PC portal entry');
  s=exactlyOne(s,'<a class="r05-portal" href="#/programs/qgis">','<a class="r05-portal r30-portal-gis" data-design-axis="D" href="#/programs/qgis">','QGIS portal entry');
  s=exactlyOne(s,'<div><small>독립 실행 및 웹</small>','<div><span class="r30-portal-axis" aria-hidden="true">02 / TECHNOLOGY</span><small>독립 실행 및 웹</small>','PC technology overline');
  s=exactlyOne(s,'<div><small>공간정보 확장 도구</small>','<div><span class="r30-portal-axis" aria-hidden="true">03 / GEOSPATIAL</span><small>공간정보 확장 도구</small>','GIS overline');
  return s;
});
// Preserve the R29 three-pillar home composition while reducing stacked whitespace via CSS only.
// Preserve original product templates; harmonize their accents by verified design-family attributes in CSS.
const css=fs.readFileSync(path.join(root,'source','r30','polish.css'),'utf8');
check(!/<\/style/i.test(css),'closing style tag forbidden in CSS');
const anchor='<style id="sunrise-r29-design">';
const start=html.indexOf(anchor),end=start<0?-1:html.indexOf('</style>',start);
check(start>=0&&end>start,'missing R29 style owner');
html=html.slice(0,end+8)+'<style id="sunrise-r30-polish">'+css+'</style>'+html.slice(end+8);
check((html.match(/<template data-route="/g)||[]).length===34,'34 existing routes');
check((html.match(/class="r28-workflow"/g)||[]).length===25,'25 product detail workflows');
check((html.match(/<a class="catalog-line[^"]*" href="#\/projects\//g)||[]).length===25,'25 owned catalogue cards');
check((html.match(/data-design-pillar="[ABD]"/g)||[]).length===3,'3 design pillars');
check((html.match(/data-design-axis="[BD]"/g)||[]).length===2,'2 overview design axes');
check(!html.includes('10개 플러그인 · 개발 완료 7개'),'stale catalogue summary');
check((html.match(/QGIS 플러그인 <span>9<\/span>/g)||[]).length===2,'R29 9/9 tab numbers');
fs.writeFileSync(output,html,'utf8');
console.log('R30 design continuity: overview QGIS 9/6/3, PC 16, B/D portal axes, 3 home pillars, 34 routes, 25 details.');
console.log('R30 HTML bytes: '+Buffer.byteLength(html,'utf8'));
