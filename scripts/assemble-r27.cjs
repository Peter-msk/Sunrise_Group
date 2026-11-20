'use strict';
// R25 source is immutable. R27 overlays small, checked changes at build time.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
require('./assemble-r25.cjs');
const output = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(output, 'utf8');
const check = (condition, message) => { if (!condition) throw new Error('R27: ' + message); };
function once(from, to) {
  check(html.split(from).length === 2, 'unexpected baseline marker: ' + from.slice(0, 90));
  html = html.replace(from, () => to);
}
const css = fs.readFileSync(path.join(__dirname, '..', 'source', 'r27', 'polish.css'), 'utf8');
check(!/<\/style/i.test(css), 'invalid CSS embedding');
once('</head>', '<meta name="robots" content="noindex,nofollow"/><style id="sunrise-r27-polish">' + css + '</style></head>');
const controls = '<div class="r27-solar-controls" role="group" aria-label="태양계 보기 설정"><div class="r27-solar-guide"><strong>태양계 탐색</strong><span id="r27-solar-help">드래그·방향키로 회전, Alt+휠로 확대·축소</span></div><div class="r27-solar-buttons"><button class="sg3-pause" type="button" aria-pressed="false">모션 정지</button><button class="r23-reset" type="button">시점 초기화</button><button class="r23-label-toggle" type="button" aria-pressed="true">행성 이름 숨기기</button><button class="r27-touch-toggle" type="button" aria-pressed="false">터치 조작 시작</button></div></div>';
once('</div></div></figure></div><div class="r19-cinema-bottom">', '</div></div>'+controls+'</figure></div><div class="r19-cinema-bottom">');
once('class="r23-stage" tabindex="0" role="img"', 'class="r23-stage" tabindex="0" aria-describedby="r27-solar-help" role="img"');
once("function down(e){if(e.pointerType==='mouse'&&e.button>2)return;", "function down(e){if(e.pointerType==='touch'&&stage.dataset.touchActive!=='true')return;if(e.pointerType==='mouse'&&e.button>2)return;");
once("function wheel(e){e.preventDefault();zoom(", "function wheel(e){if(!e.altKey||document.activeElement!==stage)return;e.preventDefault();zoom(");
once("const abort=new AbortController(),opts={signal:abort.signal};stage.addEventListener('pointerdown',down,opts);", "const abort=new AbortController(),opts={signal:abort.signal};const touchToggle=figure.querySelector('.r27-touch-toggle');if(touchToggle){touchToggle.addEventListener('click',()=>{const enabled=stage.dataset.touchActive!=='true';stage.dataset.touchActive=String(enabled);touchToggle.setAttribute('aria-pressed',String(enabled));touchToggle.textContent=enabled?'터치 조작 종료':'터치 조작 시작';},opts);}stage.addEventListener('pointerdown',down,opts);");
// Navigation: exact R25 markers; retain existing hash routes and menu ownership.
once("function render(){const raw=", "function render(reselect=false){const raw=");
once("if(anchor)requestAnimationFrame(()=>{const target=document.getElementById(anchor);if(target?.tagName==='DETAILS')target.open=true;target?.scrollIntoView();});else if(changed){", "if(anchor){const expectedHash=location.hash,expectedRoute=template.dataset.route;requestAnimationFrame(()=>{if(location.hash!==expectedHash||outlet.dataset.route!==expectedRoute)return;const target=document.getElementById(anchor);if(!target||!outlet.contains(target))return;if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start'});});}else if(changed||reselect){");
once("if(link.closest('.mobile-menu'))document.querySelector('.mobile-menu')?.removeAttribute('open');if(link.dataset.image===", "if(link.closest('.mobile-menu'))document.querySelector('.mobile-menu')?.removeAttribute('open');const href=link.getAttribute('href');if(!e.defaultPrevented&&e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&!link.hasAttribute('download')&&!link.target&&href?.startsWith('#/')&&href===location.hash){e.preventDefault();render(true);queueProgress();return;}if(link.dataset.image===");
once("document.addEventListener('keydown',e=>{if(e.key==='Escape'){const menu=document.querySelector('.mobile-menu[open]');", "document.addEventListener('click',e=>{const menu=document.querySelector('.mobile-menu[open]');if(menu&&!menu.contains(e.target)){menu.removeAttribute('open');}});const desktopViewport=matchMedia('(min-width:761px)');desktopViewport.addEventListener('change',e=>{if(e.matches)document.querySelector('.mobile-menu')?.removeAttribute('open');});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const menu=document.querySelector('.mobile-menu[open]');");
// Catalogue search refinement: one function, two catalogue controls.
const catalogueSource=fs.readFileSync(path.join(__dirname,"..","source","r27","catalogue.js"),"utf8");
check(!/<\/script/i.test(catalogueSource),"invalid catalogue source embedding");
once("function setupCatalogue(){const input=outlet.querySelector('#product-search');if(!input)return;const groups=[...outlet.querySelectorAll('.catalog-group')], rows=[...outlet.querySelectorAll('.catalog-line')],count=outlet.querySelector('.r07-result'),empty=outlet.querySelector('.r07-no-results');function filter(){const terms=input.value.trim().toLocaleLowerCase('ko').split(/\\s+/).filter(Boolean);let visible=0;rows.forEach(a=>{const stateQuery=input.value.replace(/\\s+/g,'');const stateLabel=a.querySelector('.r08-state');const statusText=(stateLabel?.textContent||a.querySelector('.catalog-line-meta')?.textContent||'').replace(/\\s+/g,'');const hit=['개발중','개발완료','개발중지'].includes(stateQuery)?(stateQuery==='개발중'?statusText.includes('개발중')&&!statusText.includes('개발중지'):statusText.includes(stateQuery)):terms.every(t=>a.textContent.toLocaleLowerCase('ko').includes(t));a.hidden=!hit;if(hit)visible++});groups.forEach(g=>g.hidden=!g.querySelector('.catalog-line:not([hidden])'));count.textContent=`${visible}개 / 전체 ${rows.length}개`;empty.hidden=visible!==0;}input.addEventListener('input',filter);outlet.querySelectorAll('.r07-category-link').forEach(a=>a.addEventListener('click',()=>{if(input.value){input.value='';filter()}}));filter()}",catalogueSource.trimEnd());
const searchMarker="<input autocomplete=\"off\" id=\"product-search\" placeholder=\"제품명 또는 기능 검색\" type=\"search\"/>";
check(html.split(searchMarker).length===3,"expected two search controls");
html=html.replaceAll(searchMarker,searchMarker+'<button class="r27-search-clear" type="button" disabled>초기화</button>');
function refreshProductReleases(html){
 const ensure=(ok,msg)=>{if(!ok)throw new Error('release details: '+msg)};
 function exact(s,from,to,count=1){ensure(s.split(from).length===count+1,'unexpected marker '+from.slice(0,100));return s.split(from).join(to)}
 function scoped(s,pattern,modify){let n=0;const next=s.replace(pattern,m=>{n++;return modify(m)});ensure(n===1,'unexpected scope '+pattern);return next}
 html=scoped(html,/<template data-route="\/projects\/file-manager">[\s\S]*?<\/template>/g,s=>{
 s=exact(s,"<strong>v1.8.0</strong>","<strong>v1.8.2</strong>",2);return exact(s,"2026.11.17","2026.11.20");
 });
 html=scoped(html,/<a class="catalog-line[^"]*" href="#\/projects\/file-manager">[\s\S]*?<\/a>/g,s=>exact(s,"<b>v1.8.0</b>","<b>v1.8.2</b>"));
 html=scoped(html,/<template data-route="\/projects\/drawing-editor">[\s\S]*?<\/template>/g,s=>{
 s=exact(s,'<div><span>이용 형태</span><strong>정식 배포</strong></div><div><span>현재 상태</span><strong>정식 배포</strong></div><div><span>이용 안내</span><strong>정식 배포</strong></div>','<div><span>이용 형태</span><strong>Windows 실행 파일</strong></div><div><span>현재 상태</span><strong>정식 배포</strong></div><div><span>배포 버전</span><strong>v1.1.0</strong></div>');
 s=exact(s,'현재 제공되는 배포 자료에는 Windows 실행 파일이 포함되어 있지 않습니다.','배포 정보 확인: 2026.11.20 · Windows 실행형 프로그램, v1.1.0.');
 return exact(s,'<div class="status-box"><small>배포 정보</small><strong>정식 배포</strong></div>','<div class="status-box"><small>배포 정보</small><strong>v1.1.0</strong></div>');
 });
 html=scoped(html,/<a class="catalog-line[^"]*" href="#\/projects\/drawing-editor">[\s\S]*?<\/a>/g,s=>exact(s,'<b>정식 배포</b><small></small>','<b>v1.1.0</b><small>정식 배포</small>'));
 return html;
}
html=refreshProductReleases(html);
function applyIntroPolicy(html){
 const ensure=(cond,msg)=>{if(!cond)throw Error("intro policy: "+msg)};
 function exact(from,to,n=1){ensure(html.split(from).length===n+1,"unexpected marker "+from.slice(0,100));html=html.split(from).join(to)}
 const removed=[...html.matchAll(/<a class="button primary-download" href="https:\/\/github\.com\/Peter-msk\/[^"]+\/releases\/download\/[^"]+">프로그램 다운로드 ↓<\/a>/g)];
 ensure(removed.length===7,"expected 7 original installer links");
 for(const m of removed) exact(m[0],"");
 const services=[["https://sunrise-pdf-editor.ko-pg.workers.dev/","#/projects/pdf-editor-web"],["https://sunrise-pdf-pro-web.ko-pg.workers.dev/","#/projects/pdf-pro-web"]];
 for(const [url,route] of services){
  exact('<a class="button secondary-service" href="'+url+'" rel="noopener noreferrer" target="_blank">웹 버전 바로가기 ↗</a>','<a class="button secondary-service" href="'+route+'">웹 버전 소개 →</a>');
  exact('<a class="button primary-download" href="'+url+'" rel="noopener noreferrer" target="_blank">웹에서 사용하기 ↗</a>','');
 }
 exact("제품 상세 페이지에서 지원 환경과 배포 형태를 확인한 뒤 다운로드 버튼을 선택하세요. 설치 파일은 안내에 따라 설치하고, 단일 실행 파일은 실행해 사용할 수 있습니다. ZIP 파일은 압축을 해제한 뒤 포함된 안내를 확인하세요.","이 홈페이지는 프로그램의 기능, 지원 환경, 개발 및 배포 현황을 소개합니다. 설치파일과 직접 배포 경로는 홈페이지에서 제공하지 않습니다.");
 exact("Drawing Editor는 어디에서 설치하나요?","Drawing Editor의 기능과 버전은 어디에서 확인하나요?");
 exact("현재 제공되는 배포 자료에는 Windows 실행 파일이 포함되어 있지 않습니다. 실행 파일을 제공할 수 있게 되면 제품 상세 페이지에서 안내하겠습니다.","Drawing Editor 제품 상세 페이지에서 기능, 이용 형태 및 배포 버전을 확인할 수 있습니다. 이 홈페이지에서는 설치파일을 제공하지 않습니다.");
 exact("각 플러그인의 지원 QGIS 버전과 검증 상태를 먼저 확인하세요. 공개된 설치 ZIP이 있는 경우 QGIS의 플러그인 관리 및 설치 메뉴에서 ZIP 설치를 사용합니다. 현재 확인되지 않은 공개 배포 링크는 표시하지 않습니다.","각 플러그인 소개 페이지에서 지원 QGIS 버전, 주요 기능 및 개발 상태를 확인할 수 있습니다. 이 홈페이지에서는 설치 ZIP 또는 직접 배포 링크를 제공하지 않습니다.");
 // Image ZIP note originally assumes receipt of the package.
 exact("압축 파일의 안내에 따라 내용을 확인해 주세요.","이용 형태와 배포 상태를 소개하며, 설치파일은 이 홈페이지에서 제공하지 않습니다.");
 html=html.replace(/<div class="project-actions"><\/div>/g,"");
 ensure(!/href\s*=\s*["'][^"']*\/releases\/download\//i.test(html),"direct release URL survived");
 ensure(!/<a\b[^>]*class="[^"]*\bprimary-download\b/i.test(html),"download action survived");
 ensure(!/프로그램 다운로드 ↓|권한 있는 계정으로 다운로드|비공개 저장소 · GitHub 로그인 및 접근 권한 필요/.test(html),"obsolete distribution copy survived");
 ensure(!/<a\b[^>]*href="https?:\/\//i.test(html),"external action survived");
 return html;
}
html=applyIntroPolicy(html);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const main=scripts.filter(s=>s[1].includes('function r23SolarRender(figure)'));
check(main.length===1, 'main script not found');
new vm.Script(main[0][1], {filename:'sunrise-r27-inline.js'});
check((html.match(/<template data-route=/g)||[]).length===35,'route count changed');
check(/<\/html>\s*$/i.test(html), 'invalid HTML closure');
const bytes=Buffer.from(html,'utf8');
fs.writeFileSync(output,bytes);
console.log('R27 UI patch verified: 35 routes; introduction-only policy; product versions refreshed; inline JS syntax PASS; '+bytes.length+' bytes; SHA-256 '+crypto.createHash('sha256').update(bytes).digest('hex'));
