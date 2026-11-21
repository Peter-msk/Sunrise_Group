'use strict';
// R29 additive three-pillar design: R25/R27/R28 remain unchanged.
require('./assemble-r28.cjs');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),target=path.join(root,'public','index.html');
let html=fs.readFileSync(target,'utf8');
function check(ok,msg){if(!ok)throw new Error('R29: '+msg)}
function patch(route,fn){
 const marker='<template data-route="'+route+'">';
 const i=html.indexOf(marker),j=i<0?-1:html.indexOf('</template>',i);
 check(i>=0&&j>i,'route not found '+route);
 const old=html.slice(i,j+11),next=fn(old);
 check(next.startsWith(marker)&&next.endsWith('</template>'),'invalid route '+route);
 html=html.slice(0,i)+next+html.slice(j+11);
}
const bridge=[
'<section class="r29-triad" aria-labelledby="r29-triad-title" data-design-contract="A+B+D">',
 '<div class="r29-triad-heading">',
  '<p class="r29-triad-eyebrow">SUNRISE GROUP <span aria-hidden="true">/</span> THREE PERSPECTIVES</p>',
  '<h2 id="r29-triad-title">현장에서 출발해,<br>기술로 연결합니다.</h2>',
  '<p class="r29-triad-intro">사람의 일을 이해하는 하나의 철학. 문서와 업무 도구에서 공간정보 분석까지, 각 영역에 맞는 기술을 연결합니다.</p>',
 '</div>',
 '<div class="r29-triad-grid" aria-label="Sunrise Group 주요 분야">',
  '<a class="r29-triad-card r29-theme-cinema" data-design-pillar="A" href="#/about">',
   '<span class="r29-triad-art r29-art-orbit" aria-hidden="true"></span>',
   '<span class="r29-triad-number">01 <span>/ GROUP &amp; VISION</span></span>',
   '<span class="r29-triad-content"><strong>일의 본질에서</strong><span>실무에서 시작하는 개발 철학과 그룹의 방향을 소개합니다.</span></span>',
   '<span class="r29-triad-action">그룹 소개 <span aria-hidden="true">↗</span></span>',
  '</a>',
  '<a class="r29-triad-card r29-theme-technology" data-design-pillar="B" href="#/programs/pc">',
   '<span class="r29-triad-art r29-art-interface" aria-hidden="true"><i></i><i></i><i></i></span>',
   '<span class="r29-triad-number">02 <span>/ PC &amp; WEB SOFTWARE</span></span>',
   '<span class="r29-triad-content"><strong>작업을 더 간결하게</strong><span>16개 PC·웹 프로그램의 기능과 운영 상태를 살펴봅니다.</span></span>',
   '<span class="r29-triad-action">PC 프로그램 <span aria-hidden="true">↗</span></span>',
  '</a>',
  '<a class="r29-triad-card r29-theme-geospatial" data-design-pillar="D" href="#/programs/qgis">',
   '<span class="r29-triad-art r29-art-topography" aria-hidden="true"></span>',
   '<span class="r29-triad-number">03 <span>/ GIS &amp; QGIS</span></span>',
   '<span class="r29-triad-content"><strong>공간정보를 더 정확하게</strong><span>9개 QGIS 플러그인의 분석 분야와 검증 범위를 살펴봅니다.</span></span>',
   '<span class="r29-triad-action">QGIS 플러그인 <span aria-hidden="true">↗</span></span>',
  '</a>',
 '</div>',
'</section>'
].join('');
patch('/',t=>{
 const anchor='<section class="r07-purpose r19-story" id="purpose">';
 check(t.split(anchor).length===2,'home purpose section anchor');
 return t.replace(anchor,bridge+anchor);
});
patch('/programs/pc',t=>{
 const old='<a href="#/programs/qgis">QGIS 플러그인 <span>10</span></a>',h='<h1>PC 프로그램</h1>';
 check(t.split(old).length===2&&t.split(h).length===2,'PC count / heading anchors');
 return t.replace(old,'<a href="#/programs/qgis">QGIS 플러그인 <span>9</span></a>')
         .replace(h,h+'<p class="r29-family-strap r29-family-technology">PC &amp; WEB / 기술 기반 작업 도구</p>');
});
patch('/programs/qgis',t=>{
 const h='<h1>QGIS 플러그인</h1>';
 check(t.split(h).length===2,'QGIS heading anchor');
 return t.replace(h,h+'<p class="r29-family-strap r29-family-geospatial">GIS &amp; QGIS / 공간정보 전문 도구</p>');
});
const css=fs.readFileSync(path.join(root,'source','r29','polish.css'),'utf8');
check(!/<\/style/i.test(css),'CSS style tag injection');
const i=html.indexOf('<style id="sunrise-r28-polish">'),j=i<0?-1:html.indexOf('</style>',i);
check(i>=0&&j>i,'R28 CSS owner');
html=html.slice(0,j+8)+'<style id="sunrise-r29-design">'+css+'</style>'+html.slice(j+8);
check((html.match(/<template data-route="/g)||[]).length===34,'34 routes retained');
check((html.match(/class="r29-triad-card /g)||[]).length===3,'three A+B+D cards');
check((html.match(/QGIS 플러그인 <span>10<\/span>/g)||[]).length===0,'stale QGIS 10');
check((html.match(/QGIS 플러그인 <span>9<\/span>/g)||[]).length===2,'correct QGIS counters');
check((html.match(/class="r28-workflow"/g)||[]).length===25,'25 product workflows');
fs.writeFileSync(target,html,'utf8');
console.log('R29 design: three pillar navigation, catalogue 9/9, 34 routes and 25 details retained. HTML bytes '+Buffer.byteLength(html));
