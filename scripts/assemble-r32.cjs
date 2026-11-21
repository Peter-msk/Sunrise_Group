'use strict';
// R32 homepage rebuild only. R25-R31 remain immutable; product routes and all JS remain intact.
require('./assemble-r31.cjs');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const target=path.join(root,'public','index.html');
let html=fs.readFileSync(target,'utf8');
function check(ok,what){if(!ok)throw new Error('R32 home contract: '+what)}
const start=html.indexOf('<template data-route="/">');
const finish=html.indexOf('</template>',start);
check(start>=0&&finish>start,'home route');
const previous=html.slice(start,finish+'</template>'.length);
check(previous.includes('data-design-contract="A+B+D"'),'R29 three-theme original present');
check(previous.includes('id="r27-solar-help"'),'original solar guide exists');
check(previous.includes('id="purpose"'),'original purpose target exists');
const sceneStart=previous.indexOf('<div class="r19-cinema-world">');
const sceneEnd=previous.indexOf('<div class="r19-cinema-bottom">',sceneStart);
check(sceneStart>0&&sceneEnd>sceneStart,'solar scene can be isolated');
let scene=previous.slice(sceneStart,sceneEnd).trim();
check(scene.includes('class="r23-stage"')&&scene.includes('class="r27-solar-controls"'),'original scene and controls preserved');
check(scene.endsWith('</figure></div>'),'solar stage boundary intact');
scene=scene.replace('<div class="r27-solar-controls"',
'<details class="r32-solar-tools"><summary>태양계 화면 조작 <span aria-hidden="true">+</span></summary><div class="r27-solar-controls"');
const figureClose=scene.lastIndexOf('</figure>');
check(figureClose>0,'closing figure exists');
scene=scene.slice(0,figureClose)+'</details>'+scene.slice(figureClose);
check((scene.match(/class="r23-stage"/g)||[]).length===1,'exactly one solar stage');
check((scene.match(/class="r27-solar-controls"/g)||[]).length===1,'original solar control set preserved');
const htmlEscape=(x)=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const home=[
'<template data-route="/">',
'<main class="home-v2 home-3d-page r32-home" id="main">',
'<section class="r19-cinema home-stage r32-hero" aria-labelledby="r32-home-title">',
 '<div class="r32-hero-inner">',
  '<div class="r32-hero-copy">',
   '<div class="r19-cinema-title">',
    '<p class="r32-hero-kicker">SUNRISE GROUP <span aria-hidden="true">/</span> SOFTWARE &amp; GEOINTELLIGENCE</p>',
    '<h1 id="r32-home-title" aria-label="Sunrise Group">Sunrise Group</h1>',
   '</div>',
   '<h2>현장의 문제를,<br><em>기술로 해결합니다.</em></h2>',
   '<p class="r32-hero-description">문서와 공간정보를 다루는 현장에서 출발해, 더 편리하고 안전한 업무 환경을 만드는 소프트웨어를 개발합니다.</p>',
   '<nav class="r32-hero-actions" aria-label="홈페이지 주요 이동">',
    '<a class="r32-hero-primary" href="#/programs">개발 제품 살펴보기 <span aria-hidden="true">↗</span></a>',
    '<a class="r32-hero-secondary" href="#/about">그룹 소개 <span aria-hidden="true">→</span></a>',
   '</nav>',
   '<p class="r32-hero-meta"><span>PC · WEB <b>16</b></span><span class="r32-meta-sep" aria-hidden="true"></span><span>QGIS <b>9</b></span><small>제품 소개 기준</small></p>',
  '</div>',
  '<div class="r32-hero-visual">',
   '<div class="r32-visual-caption"><span class="r32-live-dot" aria-hidden="true"></span> DIGITAL UNIVERSE <span class="r32-visual-note">실무 · 기술 · 공간정보</span></div>',
   scene,
  '</div>',
 '</div>',
 '<div class="r32-hero-foot"><span>하나의 철학에서 시작한 기술</span><a href="#/#solutions">솔루션 분야 보기 <span aria-hidden="true">↓</span></a></div>',
'</section>',
'<section class="r32-solutions" id="solutions" aria-labelledby="r32-solutions-title">',
 '<header class="r32-section-intro">',
  '<div><p class="r32-overline">WHAT WE BUILD <span aria-hidden="true">/</span> 두 가지 개발 분야</p><h2 id="r32-solutions-title">복잡한 업무를 단순하게.<br>필요한 기술을 정확하게.</h2></div>',
  '<p>PC·웹 프로그램부터 공간정보 분석 도구까지, 실제 업무에 필요한 제품을 분야별로 소개합니다.</p>',
 '</header>',
 '<div class="r32-domains">',
  '<a class="r32-domain r32-domain-software" data-design-axis="B" href="#/programs/pc">',
   '<div class="r32-domain-copy"><span class="r32-domain-code">PC &amp; WEB SOFTWARE</span><h3>실무를 위한 소프트웨어</h3><p>문서 편집·파일 관리, 환경영향평가 및 웹 서비스를 위한 독립 실행형·웹 프로그램입니다.</p><span class="r32-domain-stat">소개 제품 <strong>16</strong>개</span><span class="r32-domain-link">PC 프로그램 보기 <span aria-hidden="true">↗</span></span></div>',
   '<figure class="r32-domain-figure"><img src="/assets/r28/08abfc2a8d30ae14e29a9816.png" width="1250" height="798" loading="lazy" decoding="async" alt="Sunrise PDF PRO 실제 개발 버전의 Windows 프로그램 화면"/><figcaption>실제 실행 화면 · Sunrise PDF PRO 개발 버전</figcaption></figure>',
  '</a>',
  '<a class="r32-domain r32-domain-gis" data-design-axis="D" href="#/programs/qgis">',
   '<div class="r32-domain-copy"><span class="r32-domain-code">GEOSPATIAL / QGIS</span><h3>공간정보 분석과 활용</h3><p>환경영향평가 조사지점 설계, 표고·경사 분석, 지도 제작 등 QGIS 기반 공간정보 도구를 소개합니다.</p><span class="r32-domain-stat">소개 플러그인 <strong>9</strong>개</span><span class="r32-domain-link">QGIS 플러그인 보기 <span aria-hidden="true">↗</span></span></div>',
   '<figure class="r32-domain-figure"><img src="/assets/r28/35958198c701f4c84d64911c.webp" width="900" height="600" loading="lazy" decoding="async" alt="표고 기반 3차원 지형을 표현한 기능 설명용 모델"/><figcaption>기능 설명용 지형 모델 · 실제 QGIS 실행 화면 아님</figcaption></figure>',
  '</a>',
 '</div>',
'</section>',
'<section class="r32-ethos" id="purpose" aria-labelledby="r32-ethos-title">',
 '<div class="r32-ethos-lead">',
  '<p class="r32-overline">WHY SUNRISE <span aria-hidden="true">/</span> 일하는 방식을 바꾸는 기술</p>',
  '<h2 id="r32-ethos-title">기능보다,<br>실제 쓰임을 먼저.</h2>',
  '<p>반복되는 문서 작업과 환경영향평가, 공간정보 분석에는 많은 시간이 필요합니다. Sunrise Group은 업무 현장에서 필요한 기능을 중심으로 소프트웨어를 설계하고, 실제 사용 과정에서 발견되는 문제를 개선합니다.</p>',
  '<a class="r32-text-link" href="#/about">Sunrise Group 소개 <span aria-hidden="true">↗</span></a>',
 '</div>',
 '<div class="r32-values" aria-label="개발의 세 가지 원칙">',
  '<article><span class="r32-value-rule" aria-hidden="true"></span><h3>사용 편의성</h3><p>필요한 기능을 쉽게 찾고 작업을 간단하게 이어갈 수 있도록 설계합니다.</p></article>',
  '<article><span class="r32-value-rule" aria-hidden="true"></span><h3>자료 보호</h3><p>원본과 기존 작업 환경을 보호하는 것을 기본으로 삼습니다.</p></article>',
  '<article><span class="r32-value-rule" aria-hidden="true"></span><h3>지속적인 검증</h3><p>실제 사용 환경을 기준으로 안정성과 품질을 개선합니다.</p></article>',
  '<a class="r32-text-link" href="#/philosophy">개발 이념과 원칙 <span aria-hidden="true">↗</span></a>',
 '</div>',
'</section>',
'<section class="r32-future" aria-label="앞으로의 방향">',
 '<p class="r32-overline">LOOKING AHEAD</p>',
 '<h2>업무와 기술이<br>자연스럽게 연결되도록.</h2>',
 '<div><p>개별 업무 도구를 넘어, 문서와 공간정보가 자연스럽게 연결되는 업무 환경을 만들어갑니다.</p><a href="#/future">미래 방향 알아보기 <span aria-hidden="true">↗</span></a></div>',
'</section>',
'</main></template>'
].join('');
check(!home.includes('r29-triad'),'no duplicate theme cards');
check(home.includes(scene),'existing solar markup embedded');
check((home.match(/<h1\b/g)||[]).length===1,'single semantic homepage h1');
check((home.match(/class="r32-domain /g)||[]).length===2,'two clear product categories');
check((home.match(/class="r23-stage"/g)||[]).length===1,'one solar stage');
check((home.match(/class="r27-solar-controls"/g)||[]).length===1,'all old solar buttons still available');
const previousRoutes=(html.match(/<template data-route="/g)||[]).length;
check(previousRoutes===34,'expected R31 34 routes');
html=html.slice(0,start)+home+html.slice(finish+'</template>'.length);
const css=fs.readFileSync(path.join(root,'source','r32','polish.css'),'utf8');
check(!/<\/style/i.test(css),'style tag must be owned by builder');
const anchor='<style id="sunrise-r31-polish">';
const cssStart=html.indexOf(anchor),cssEnd=cssStart<0?-1:html.indexOf('</style>',cssStart);
check(cssStart>=0&&cssEnd>cssStart,'R31 stylesheet anchor present');
html=html.slice(0,cssEnd+8)+'<style id="sunrise-r32-home">'+css+'</style>'+html.slice(cssEnd+8);
check((html.match(/<template data-route="/g)||[]).length===34,'unchanged 34 routes');
check((html.match(/class="r28-workflow" id="workflow"/g)||[]).length===25,'25 product flows untouched');
check((html.match(/class="r31-workflow-jump"/g)||[]).length===25,'25 detail shortcuts untouched');
check((html.match(/<a class="catalog-line[^"]*" href="#\/projects\//g)||[]).length===25,'25 catalogue entries untouched');
check(html.includes('9개 플러그인 · 개발 완료 6개 · 개발 중 3개'),'QGIS count contract');
check((html.match(/data-design-axis="[BD]"/g)||[]).length===4,'overview + homepage B/D axes');
fs.writeFileSync(target,html,'utf8');
console.log('R32 home rebuilt: branded two-column solar hero, B/D product focus, unified philosophy; 34 routes, 25 product workflows and solar controls retained.');
console.log('R32 HTML bytes: '+Buffer.byteLength(html,'utf8'));
