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
let changed=0;
html=html.replace(/(<a class="button primary-download" href="https:\/\/github\.com\/Peter-msk\/[^"]+\/releases\/download\/[^"]+">)프로그램 다운로드 ↓<\/a>/g, (_, start)=>{
  changed++;
  return start+'권한 있는 계정으로 다운로드 ↓</a><small class="r27-download-note">비공개 저장소 · GitHub 로그인 및 접근 권한 필요</small>';
});
check(changed===7, 'expected 7 private release links, got '+changed);
function refreshProductReleases(html){
 const ensure=(ok,msg)=>{if(!ok)throw new Error('release details: '+msg)};
 function exact(s,from,to,count=1){ensure(s.split(from).length===count+1,'unexpected marker '+from.slice(0,100));return s.split(from).join(to)}
 function scoped(s,pattern,modify){let n=0;const next=s.replace(pattern,m=>{n++;return modify(m)});ensure(n===1,'unexpected scope '+pattern);return next}
 const fileOld="https://github.com/Peter-msk/Sunrise-File-Manager/releases/download/v1.8.0/Sunrise_File_Manager_1.8.0_Setup.exe";
 const fileNew="https://github.com/Peter-msk/Sunrise-File-Manager/releases/download/v1.8.2/Sunrise_File_Manager_1.8.2_Setup.exe";
 const drawingUrl="https://github.com/Peter-msk/Sunrise_Drawing_Editor/releases/download/v1.1.0/Sunrise.Drawing.Editor.exe";
 html=scoped(html,/<template data-route="\/projects\/file-manager">[\s\S]*?<\/template>/g,s=>{
 s=exact(s,fileOld,fileNew);s=exact(s,"<strong>v1.8.0</strong>","<strong>v1.8.2</strong>",2);return exact(s,"2026.11.17","2026.11.20");
 });
 html=scoped(html,/<a class="catalog-line[^"]*" href="#\/projects\/file-manager">[\s\S]*?<\/a>/g,s=>exact(s,"<b>v1.8.0</b>","<b>v1.8.2</b>"));
 html=scoped(html,/<template data-route="\/projects\/drawing-editor">[\s\S]*?<\/template>/g,s=>{
 s=exact(s,'<div class="project-actions"></div>','<div class="project-actions"><a class="button primary-download" href="'+drawingUrl+'">권한 있는 계정으로 다운로드 ↓</a><small class="r27-download-note">비공개 저장소 · GitHub 로그인 및 접근 권한 필요</small></div>');
 s=exact(s,'<div><span>이용 형태</span><strong>정식 배포</strong></div><div><span>현재 상태</span><strong>정식 배포</strong></div><div><span>이용 안내</span><strong>정식 배포</strong></div>','<div><span>이용 형태</span><strong>Windows 실행 파일</strong></div><div><span>현재 상태</span><strong>정식 배포</strong></div><div><span>배포 버전</span><strong>v1.1.0</strong></div>');
 s=exact(s,'현재 제공되는 배포 자료에는 Windows 실행 파일이 포함되어 있지 않습니다.','배포 정보 확인: 2026.11.20 · GitHub 공식 릴리즈 v1.1.0에서 Windows EXE 제공. 비공개 저장소 접근 권한이 필요합니다.');
 return exact(s,'<div class="status-box"><small>배포 정보</small><strong>정식 배포</strong></div>','<div class="status-box"><small>배포 정보</small><strong>v1.1.0</strong></div>');
 });
 html=scoped(html,/<a class="catalog-line[^"]*" href="#\/projects\/drawing-editor">[\s\S]*?<\/a>/g,s=>exact(s,'<b>정식 배포</b><small></small>','<b>v1.1.0</b><small>정식 배포</small>'));
 ensure(!html.includes(fileOld),'old download survived');ensure(html.split(fileNew).length===2,'file link count');ensure(html.split(drawingUrl).length===2,'drawing link count');
 return html;
}
html=refreshProductReleases(html);
check((html.match(/class="r27-download-note"/g)||[]).length===8,'expected 8 private download notices');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const main=scripts.filter(s=>s[1].includes('function r23SolarRender(figure)'));
check(main.length===1, 'main script not found');
new vm.Script(main[0][1], {filename:'sunrise-r27-inline.js'});
check((html.match(/<template data-route=/g)||[]).length===35,'route count changed');
check(/<\/html>\s*$/i.test(html), 'invalid HTML closure');
const bytes=Buffer.from(html,'utf8');
fs.writeFileSync(output,bytes);
console.log('R27 UI patch verified: 35 routes; 8 private download labels; product details refreshed; inline JS syntax PASS; '+bytes.length+' bytes; SHA-256 '+crypto.createHash('sha256').update(bytes).digest('hex'));
