'use strict';
// R28 builds on the immutable R25 source and the verified R27 overlay.
// Product copy, runtime evidence and image assets are maintained in source/r28.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
require('./assemble-r27.cjs');

const root = path.join(__dirname, '..');
const output = path.join(root, 'public', 'index.html');
const assetDir = path.join(root, 'public', 'assets', 'r28');
let html = fs.readFileSync(output, 'utf8');
const fail = message => { throw new Error('R28: ' + message); };
const check = (condition, message) => { if (!condition) fail(message); };
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const replaceOne = (source, from, to, label) => {
  check(source.split(from).length === 2, 'expected one ' + (label || 'marker') + ': ' + from.slice(0, 100));
  return source.replace(from, () => to);
};

/* R15 solar textures are only consumed by the home solar scene.
   Defer their requests until that scene intersects the viewport. */
const solarPreloadBefore = "const ro=new ResizeObserver(()=>requestPaint());ro.observe(stage);const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){requestPaint();schedule();}else if(!interaction)stop();});io.observe(figure);sync();resize();paint();schedule();r15PreloadPlanets().then(results=>{if(!disposed){figure.dataset.planetTexturesReady=String(results.every(Boolean));sprites.clear();requestPaint();}});";
const solarPreloadAfter = "const ro=new ResizeObserver(()=>requestPaint());ro.observe(stage);const preloadPlanetTextures=()=>{if(route!=='/'||figure.dataset.r15PlanetPreloadRequested==='true')return;figure.dataset.r15PlanetPreloadRequested='true';r15PreloadPlanets().then(results=>{if(!disposed){figure.dataset.planetTexturesReady=String(results.every(Boolean));sprites.clear();requestPaint();}});};const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){preloadPlanetTextures();requestPaint();schedule();}else if(!interaction)stop();});io.observe(figure);sync();resize();paint();schedule();";
html = replaceOne(html, solarPreloadBefore, solarPreloadAfter, 'defer home-only solar textures');
const r28MainScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(match => match[1].includes('function sg3Render(figure)'));
check(r28MainScripts.length === 1, 'expected one R28 main rendering script');
new vm.Script(r28MainScripts[0][1], { filename: 'sunrise-r28-inline.js' });
check(html.includes("figure.dataset.r15PlanetPreloadRequested==='true'"), 'solar texture lazy-load guard missing');
const planetMapStart = html.indexOf('const R15_PLANET_DATA=');
const planetObjectStart = html.indexOf('{', planetMapStart);
const planetObjectEnd = html.indexOf('},R15_PLANET_IMAGES=', planetObjectStart);
check(planetMapStart >= 0 && planetObjectEnd > planetObjectStart, 'solar texture manifest boundary missing');
const planetAssetUrls = Object.values(JSON.parse(html.slice(planetObjectStart, planetObjectEnd + 1)));
check(planetAssetUrls.length === 9, 'expected nine solar textures, got ' + planetAssetUrls.length);
check(planetAssetUrls.every(url => url.startsWith('/assets/r28/')), 'solar texture asset URLs not externalized: ' + JSON.stringify(planetAssetUrls.map(url => String(url).slice(0, 100))));
function patchTemplate(route, mutate) {
  const marker = '<template data-route="' + route + '">';
  const start = html.indexOf(marker);
  check(start >= 0, 'missing route template ' + route);
  const endStart = html.indexOf('</template>', start);
  check(endStart >= 0, 'unterminated route template ' + route);
  const end = endStart + '</template>'.length;
  const before = html.slice(start, end);
  const after = mutate(before);
  check(typeof after === 'string' && after.startsWith(marker) && after.endsWith('</template>'), 'invalid patched template ' + route);
  html = html.slice(0, start) + after + html.slice(end);
}
function patchCard(template, route, description) {
  const pattern = new RegExp('<a class="catalog-line[^"]*" href="#' + route + '">[\\s\\S]*?<\\/a>');
  const match = template.match(pattern);
  check(!!match, 'catalogue card missing ' + route);
  const card = match[0];
  check((card.match(/<p(?:\s[^>]*)?>/g) || []).length === 1, 'catalogue description marker mismatch ' + route);
  const updated = card.replace(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/, '<p>' + escapeHtml(description) + '</p>');
  return template.replace(card, updated);
}
function patchProductDetail(route, data) {
  patchTemplate(route, template => {
    let next = template;
    const leadPattern = /(<h1[^>]*>[\s\S]*?<\/h1>\s*)<p(?:\s[^>]*)?>[\s\S]*?<\/p>/;
    check(leadPattern.test(next), 'hero lead missing ' + route);
    next = next.replace(leadPattern, '$1<p>' + escapeHtml(data.lead) + '</p>');

    const detailPattern = /<p class="detail-text(?:\s[^"]*)?">[\s\S]*?<\/p>/;
    const detail = '<p class="detail-text r28-copy">' + escapeHtml(data.summary) + '</p>';
    if (detailPattern.test(next)) {
      next = next.replace(detailPattern, detail);
    } else {
      const listStart = next.indexOf('<ul class="feature-list">');
      check(listStart >= 0, 'feature list missing for summary insertion ' + route);
      const h2End = next.lastIndexOf('</h2>', listStart);
      check(h2End >= 0, 'feature heading missing for summary insertion ' + route);
      next = next.slice(0, h2End + 5) + detail + next.slice(h2End + 5);
    }

    const featurePattern = /<ul class="feature-list">[\s\S]*?<\/ul>/g;
    const featureMatches = next.match(featurePattern) || [];
    check(featureMatches.length === 1, 'expected one feature list ' + route);
    const features = '<ul class="feature-list">' + data.features.map((item, index) =>
      '<li><span>' + String(index + 1).padStart(2, '0') + '</span>' + escapeHtml(item) + '</li>'
    ).join('') + '</ul>';
    const workflow = '<div class="r28-workflow" aria-label="작업 흐름"><h3>작업 흐름</h3><ol>' +
      data.workflow.map((item, index) =>
        '<li><span class="r28-step-index">' + String(index + 1).padStart(2, '0') + '</span><span>' + escapeHtml(item) + '</span></li>'
      ).join('') + '</ol></div>';
    next = next.replace(featurePattern, features + workflow);

    if (data.notice) {
      next = next.replace('</div><p class="r08-screen-note"', '</div><div class="r28-product-note">' + escapeHtml(data.notice) + '</div><p class="r08-screen-note"');
    }
    if (data.runtimeNote) {
      next = next.replace('이번 홈페이지 작업에서는 미검증', 'NOT RUN · 실기 검증 대기');
      next = next.replace('</div><p class="r08-screen-note"', '</div><div class="r28-runtime-note">' + escapeHtml(data.runtimeNote) + '</div><p class="r08-screen-note"');
    }
    check(next.includes('class="r28-workflow"'), 'workflow insertion failed ' + route);
    return next;
  });
}

const products = JSON.parse(fs.readFileSync(path.join(root, 'source', 'r28', 'products.json'), 'utf8'));
check(products && products.products && Object.keys(products.products).length === 25, 'expected 25 verified product content records');

// Refresh catalogue descriptions and make the category counts match the owned product set.
patchTemplate('/programs/pc', template => {
  let next = template.replace(/(<h1>PC 프로그램<\/h1>\s*<p>)[\s\S]*?(<\/p>)/, '$1' + escapeHtml(products.catalogueLead) + '$2');
  check(next !== template, 'PC catalogue introduction not updated');
  for (const [route, data] of Object.entries(products.products)) {
    if (!route.startsWith('/projects/') || route.startsWith('/projects/qgis-') || route === '/projects/photo-classifier') continue;
    if (!['capture','file-manager','cleaner','pdf-editor','pdf-pro','image','drawing-editor','eiass','finder','eia-manager','pdf-editor-web','pdf-pro-web','eia-hub','eiass-mobile','gis','aermod'].some(id => route === '/projects/' + id)) continue;
    next = patchCard(next, route, data.cardDescription);
  }
  return next;
});
patchTemplate('/programs/qgis', template => {
  let next = template.replace(/(<h1>QGIS 플러그인<\/h1>\s*<p>)[\s\S]*?(<\/p>)/, '$1' + escapeHtml(products.qgisLead) + '$2');
  check(next !== template, 'QGIS catalogue introduction not updated');
  for (const route of ['/projects/qgis-tool','/projects/protection-analyzer','/projects/survey-designer','/projects/survey-locator','/projects/elevation-slope','/projects/3d-map','/projects/map-designer','/projects/onmap-spatializer','/projects/color-distributor']) {
    next = patchCard(next, route, products.products[route].cardDescription);
  }
  const photoCard = /<a class="catalog-line[^"]*" href="#\/projects\/photo-classifier">[\s\S]*?<\/a>/g;
  check((next.match(photoCard) || []).length === 1, 'expected one non-owned catalogue card to remove');
  next = next.replace(photoCard, '');
  next = replaceOne(next, 'QGIS 플러그인 <span>10</span>', 'QGIS 플러그인 <span>9</span>', 'QGIS count tab');
  next = replaceOne(next, '플러그인·현장자료 관리 <span>2개 ↓</span>', '플러그인 관리 <span>1개 ↓</span>', 'QGIS category navigation');
  next = replaceOne(next, '<h3>플러그인·현장자료 관리</h3><p>통합 카탈로그와 현장사진 검수 · 2개</p>', '<h3>플러그인 관리</h3><p>플러그인·스크립트 통합 관리 · 1개</p>', 'QGIS category heading');
  const groupStart = next.indexOf('<section class="catalog-group r19-atlas-group" data-group-order="1" id="manage">');
  const groupEndStart = next.indexOf('</section>', groupStart);
  check(groupStart >= 0 && groupEndStart > groupStart, 'QGIS plugin-management group boundary missing');
  const groupEnd = groupEndStart + '</section>'.length;
  let firstGroup = next.slice(groupStart, groupEnd);
  const nonOwnedGroupArt = firstGroup.match(/<figure class="r19-group-art">[\s\S]*?<\/figure>/);
  check(!!nonOwnedGroupArt, 'photo-review group illustration missing');
  firstGroup = firstGroup.replace(nonOwnedGroupArt[0], '');
  firstGroup = firstGroup.replace('class="catalog-group r19-atlas-group"', 'class="catalog-group r19-atlas-group r28-no-group-art"');
  next = next.slice(0, groupStart) + firstGroup + next.slice(groupEnd);
  next = replaceOne(next, '<p class="r08-catalog-summary"><strong>개발 완료 7개</strong><span aria-hidden="true">·</span><strong>개발 중 3개</strong></p>', '<p class="r08-catalog-summary"><strong>개발 완료 6개</strong><span aria-hidden="true">·</span><strong>개발 중 3개</strong></p><p class="r28-catalogue-note">' + escapeHtml(products.qgisNotice) + '</p>', 'QGIS status summary');
  return next;
});

// Product detail pages use one content record for the hero, summary, feature list and workflow.
for (const [route, data] of Object.entries(products.products)) patchProductDetail(route, data);

// Remove the entire non-owned product detail route. The final HTML must not retain links, IDs or copy.
const photoTemplate = /<template data-route="\/projects\/photo-classifier">[\s\S]*?<\/template>/g;
check((html.match(photoTemplate) || []).length === 1, 'expected one non-owned detail template to remove');
html = html.replace(photoTemplate, '');

// The legacy page also owns route-keyed hero/scene metadata and a raw base64 preview.
// Remove only the two exact route entries; preserve every other scene and image.
let removedNonOwnedSceneEntries = 0;
const routeProperty = /,\s*["']\/projects\/photo-classifier["']\s*:\s*\[[^\]]*\]/g;
html = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, script => {
  const matches = script.match(routeProperty) || [];
  removedNonOwnedSceneEntries += matches.length;
  return matches.length ? script.replace(routeProperty, '') : script;
});
check(removedNonOwnedSceneEntries === 2, 'expected two route-owned scene/preview data entries, removed ' + removedNonOwnedSceneEntries);
check(!html.includes('photo-classifier') && !html.includes('사진 분류 도우미'), 'non-owned product content remains in final HTML');

const css = fs.readFileSync(path.join(root, 'source', 'r28', 'polish.css'), 'utf8');
check(!/<\/style/i.test(css), 'invalid R28 CSS embedding');
const r27StyleStart = html.indexOf('<style id="sunrise-r27-polish">');
const r27StyleEnd = html.indexOf('</style>', r27StyleStart);
check(r27StyleStart >= 0 && r27StyleEnd >= 0, 'R27 style owner missing');
html = html.slice(0, r27StyleEnd + 8) + '<style id="sunrise-r28-polish">' + css + '</style>' + html.slice(r27StyleEnd + 8);

// Replace the R27 data-URI preview handler with a same-origin, hashed static-asset preview.
const preview = fs.readFileSync(path.join(root, 'source', 'r28', 'image-preview.js'), 'utf8');
new vm.Script(preview, { filename: 'sunrise-r28-image-preview.js' });
const previewStart = html.indexOf('function openProductPreview(event,link){');
check(previewStart >= 0, 'existing image preview handler missing');
const previewEnd = html.indexOf('\n}\n', previewStart);
check(previewEnd >= 0, 'image preview handler end missing');
html = html.slice(0, previewStart) + preview.trimEnd() + html.slice(previewEnd + 3);

// Externalize and de-duplicate embedded screenshots. Names are content-addressed for immutable caching.
fs.rmSync(assetDir, { recursive: true, force: true });
fs.mkdirSync(assetDir, { recursive: true });
const extension = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp', 'image/gif':'gif' };
function dimensions(buffer, mime) {
  if (mime === 'image/png' && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (mime === 'image/jpeg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  if (mime === 'image/webp' && buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }
    if (chunk === 'VP8 ' && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L' && buffer.length >= 25) {
      const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
      return { width: 1 + (((b2 & 0x3f) << 8) | b1), height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)) };
    }
  }
  return null;
}
const htmlBytesBeforeExternalization = Buffer.byteLength(html, 'utf8');
const assetByUri = new Map();
const assetByUrl = new Map();
let dataUriOccurrences = 0;
const dataUriPattern = /data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)/gi;
html = html.replace(dataUriPattern, (full, mime, base64) => {
  dataUriOccurrences++;
  if (assetByUri.has(full)) return assetByUri.get(full).url;
  const ext = extension[mime.toLowerCase()];
  check(!!ext, 'unsupported embedded image type ' + mime);
  const buffer = Buffer.from(base64, 'base64');
  check(buffer.length > 0, 'empty embedded image');
  const digest = crypto.createHash('sha256').update(mime.toLowerCase() + ':' + base64).digest('hex');
  const file = digest.slice(0, 24) + '.' + ext;
  const url = '/assets/r28/' + file;
  const filePath = path.join(assetDir, file);
  fs.writeFileSync(filePath, buffer);
  const size = dimensions(buffer, mime.toLowerCase());
  check(size && size.width > 0 && size.height > 0, 'image dimensions unavailable for ' + file);
  const asset = { file, url, mime: mime.toLowerCase(), bytes: buffer.length, sha256: crypto.createHash('sha256').update(buffer).digest('hex'), width: size.width, height: size.height };
  assetByUri.set(full, asset);
  assetByUrl.set(url, asset);
  return url;
});
const uniqueAssetCount = assetByUri.size;
check(dataUriOccurrences === 36 && uniqueAssetCount === 23, 'embedded image inventory changed; observed ' + dataUriOccurrences + ' references / ' + uniqueAssetCount + ' unique assets');

let imageTags = 0;
let eagerImages = 0;
html = html.replace(/<template data-route="([^"]+)">([\s\S]*?)<\/template>/g, (template, route, content) => {
  let firstImageInRoute = true;
  const updatedContent = content.replace(/<img\b[^>]*>/gi, tag => {
  const src = (tag.match(/\bsrc="([^"]+)"/i) || [])[1];
  if (!src || !src.startsWith('/assets/r28/')) return tag;
  const asset = assetByUrl.get(src);
  check(!!asset, 'image tag points to an unknown asset ' + src);
  imageTags++;
  let next = tag;
  if (!/\bclass="/i.test(next)) next = next.replace('<img', '<img class="r28-optimized-image"');
  else next = next.replace(/\bclass="([^"]*)"/i, (m, value) => 'class="' + value + ' r28-optimized-image"');
  next = next.replace(/\sloading="[^"]*"/i, '');
  if (firstImageInRoute) {
    eagerImages++;
    next = next.replace('<img', '<img loading="eager" fetchpriority="high"');
  } else {
    next = next.replace('<img', '<img loading="lazy"');
  }
  firstImageInRoute = false;
  if (!/\bdecoding="/i.test(next)) next = next.replace('<img', '<img decoding="async"');
  if (!/\bwidth="/i.test(next)) next = next.replace('<img', '<img width="' + asset.width + '"');
  if (!/\bheight="/i.test(next)) next = next.replace('<img', '<img height="' + asset.height + '"');
  return next;
  });
  return template.replace(content, updatedContent);
});
check(imageTags === 17, 'expected 17 optimized image tags, got ' + imageTags);
check(eagerImages === 12, 'expected 12 route-leading eager images, got ' + eagerImages);
check(!/data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]{128,}/i.test(html), 'inline base64 image payload remains');
check((html.match(/<template data-route="/g) || []).length === 34, 'expected 34 final route templates');
check((html.match(/<a class="catalog-line[^"]*" href="#\/projects\//g) || []).length === 25, 'expected 25 product catalogue cards');
check(!html.includes('photo-classifier'), 'removed product route remains');
for (const route of Object.keys(products.products)) {
  check(html.includes('<template data-route="' + route + '">'), 'missing product detail route ' + route);
  const start = html.indexOf('<template data-route="' + route + '">');
  const end = html.indexOf('</template>', start);
  const template = html.slice(start, end);
  check(template.includes('class="r28-workflow"'), 'missing R28 workflow ' + route);
}
const qgisStart = html.indexOf('<template data-route="/programs/qgis">');
const qgisEnd = html.indexOf('</template>', qgisStart);
const qgisHtml = html.slice(qgisStart, qgisEnd);
check((qgisHtml.match(/<a class="catalog-line[^"]*" href="#\/projects\//g) || []).length === 9, 'QGIS catalogue count is not 9');
check(qgisHtml.includes('개발 완료 6개') && qgisHtml.includes('개발 중 3개'), 'QGIS development summary is incorrect');

const htmlBytes = Buffer.byteLength(html, 'utf8');
const assetBytes = [...assetByUrl.values()].reduce((sum, asset) => sum + asset.bytes, 0);
const htmlSha = crypto.createHash('sha256').update(html).digest('hex');
fs.writeFileSync(output, html, 'utf8');
console.log('R28 portal entry validated: ' + htmlBytes + ' bytes; SHA-256 ' + htmlSha);
console.log('R28 routes: 34; PC programs: 16; QGIS plugins: 9; detail records: 25; non-owned listing removed.');
console.log('R28 images: ' + dataUriOccurrences + ' inline references → ' + uniqueAssetCount + ' content-addressed assets; ' + imageTags + ' optimized tags (' + eagerImages + ' eager route-leading, ' + (imageTags - eagerImages) + ' lazy); assets ' + assetBytes + ' bytes.');
console.log('R28 rendering: HTML reduced by ' + (100 * (1 - htmlBytes / htmlBytesBeforeExternalization)).toFixed(1) + '% (' + htmlBytesBeforeExternalization + ' → ' + htmlBytes + ' bytes).');
