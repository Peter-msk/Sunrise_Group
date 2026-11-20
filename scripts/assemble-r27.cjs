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
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const main=scripts.filter(s=>s[1].includes('function r23SolarRender(figure)'));
check(main.length===1, 'main script not found');
new vm.Script(main[0][1], {filename:'sunrise-r27-inline.js'});
check((html.match(/<template data-route=/g)||[]).length===35,'route count changed');
check(/<\/html>\s*$/i.test(html), 'invalid HTML closure');
const bytes=Buffer.from(html,'utf8');
fs.writeFileSync(output,bytes);
console.log('R27 UI patch verified: 35 routes; 7 private download labels; inline JS syntax PASS; '+bytes.length+' bytes; SHA-256 '+crypto.createHash('sha256').update(bytes).digest('hex'));
