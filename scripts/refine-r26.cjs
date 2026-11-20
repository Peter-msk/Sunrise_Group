'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const output = path.join(root, 'public', 'index.html');
const original = fs.readFileSync(output);
const expected = 'aadf5a7f45b3575add06de90fc837e3142d3821f22f4a2b80c8ae0e4bee29aef';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (digest(original) !== expected) throw new Error('R26 requires the verified R25 baseline');
const html = original.toString('utf8');
const marker = 'sunrise-detail-r26';
const css = fs.readFileSync(path.join(root, 'source', 'r26', 'detail.css'), 'utf8');
if (html.includes(marker) || /<\/style/i.test(css)) throw new Error('Invalid refinement input');
const boundary = '</style></head>';
const index = html.indexOf(boundary);
if (index < 0 || html.indexOf(boundary, index + boundary.length) !== -1) throw new Error('R25 style boundary not found exactly once');
const insertion = '<style id="' + marker + '">\n' + css + '</style>';
const start = index + '</style>'.length;
const result = html.slice(0, start) + insertion + html.slice(start);
const restored = Buffer.from(result.slice(0,start) + result.slice(start+insertion.length), 'utf8');
if (!restored.equals(original)) throw new Error('Non-style source changed');
function removeProgramDownloads(html) {
  const programLink = /<a\b[^>]*\bhref="https:\/\/github\.com\/[^"<>]+\/releases\/download\/[^"<>]+"[^>]*>프로그램 다운로드 ↓<\/a>/g;
  const removed = [...html.matchAll(programLink)].map(m=>m[0]);
  if (removed.length !== 7) throw new Error('Program download inventory changed: ' + removed.length);
  let result = html.replace(programLink, '');
  const empty = /<div class="project-actions"><\/div>/g;
  result = result.replace(empty, '');
  const copy = [
    ['제품 상세 페이지에서 지원 환경과 배포 형태를 확인한 뒤 다운로드 버튼을 선택하세요. 설치 파일은 안내에 따라 설치하고, 단일 실행 파일은 실행해 사용할 수 있습니다. ZIP 파일은 압축을 해제한 뒤 포함된 안내를 확인하세요.', '제품 상세 페이지에서 지원 환경과 주요 기능, 실행 화면을 확인할 수 있습니다. 이 홈페이지에서는 프로그램 설치 파일을 제공하지 않습니다.'],
    ['Drawing Editor는 어디에서 설치하나요?', 'Drawing Editor의 지원 환경은 어디에서 확인하나요?'],
    ['현재 제공되는 배포 자료에는 Windows 실행 파일이 포함되어 있지 않습니다. 실행 파일을 제공할 수 있게 되면 제품 상세 페이지에서 안내하겠습니다.', 'Drawing Editor의 제품 상세 페이지에서 지원 환경과 기능을 확인할 수 있습니다.'],
    ['각 플러그인의 지원 QGIS 버전과 검증 상태를 먼저 확인하세요. 공개된 설치 ZIP이 있는 경우 QGIS의 플러그인 관리 및 설치 메뉴에서 ZIP 설치를 사용합니다. 현재 확인되지 않은 공개 배포 링크는 표시하지 않습니다.', '각 플러그인의 제품 상세 페이지에서 지원 QGIS 버전과 검증 상태를 확인하세요. 이 홈페이지에서는 플러그인 설치 파일을 제공하지 않습니다.'],
    ['개발 상태와 공개 배포·실제 QGIS 실행 검증은 별도로 관리합니다. 공개 링크가 확인되면 안내합니다.', '개발 상태와 실제 QGIS 실행 검증은 별도로 관리합니다.'],
  ];
  for (const [from,to] of copy) {
    if (!result.includes(from)) throw new Error('Expected help copy missing: '+from.slice(0,35));
    result = result.split(from).join(to);
  }
  if (/github\.com\/[^"'<>\s]+\/releases\/(?:download|latest|tag)\b/i.test(result) || /프로그램 다운로드|다운로드 버튼을 선택/.test(result)) throw new Error('Program distribution path remains');
  const web = /<a\b[^>]*href="https:\/\/[^"]+\.workers\.dev\/"[^>]*>[^<]*<\/a>/g;
  const routes = /<template\b[^>]*data-route="[^"]+"/g;
  for (const [label,pattern] of [['web access',web],['page routes',routes]]) {
    if (JSON.stringify(html.match(pattern)) !== JSON.stringify(result.match(pattern))) throw new Error(label+' changed');
  }
  return result;
}
const sanitized = removeProgramDownloads(result);
fs.writeFileSync(output, sanitized, 'utf8');
console.log('R26 refinement built; 7 program distribution paths removed; SHA-256 ' + digest(Buffer.from(sanitized, 'utf8')));
