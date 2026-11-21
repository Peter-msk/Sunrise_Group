'use strict';
// Source-owned R34 final polish. The deployed HTML is generated, never committed.
// No external services, images, runtime dependencies or product-data changes.
const ORIGINAL_DESCRIPTION='<meta content="Sunrise Group의 목표와 개발 원칙, PC 프로그램 및 QGIS 플러그인 소개" name="description">';
const FINAL_DESCRIPTION='Sunrise Group은 현장 중심의 PC·웹 프로그램 16개와 공간정보·QGIS 플러그인 9개를 소개합니다. 실제 업무에 필요한 소프트웨어와 개발 원칙을 확인하세요.';
const escapeAttr=value=>value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function one(input,old,label){
 if(input.split(old).length!==2)throw new Error('R34 source contract: exactly one '+label);
}
function finishHomepage(source){
 if(typeof source!=='string'||source.length<1000)throw new TypeError('R34 requires the built source HTML string');
 one(source,ORIGINAL_DESCRIPTION,'original description metadata');
 let html=source.replace(ORIGINAL_DESCRIPTION,'<meta content="'+escapeAttr(FINAL_DESCRIPTION)+'" name="description">');
 const title='<title>Sunrise Group</title>';
 one(html,title,'site title');
 const social=[
   '<meta property="og:type" content="website">',
   '<meta property="og:locale" content="ko_KR">',
   '<meta property="og:title" content="Sunrise Group | 실무 중심 소프트웨어와 공간정보">',
   '<meta property="og:description" content="'+escapeAttr(FINAL_DESCRIPTION)+'">'
 ].join('');
 html=html.replace(title,title+social);
 // Keep the R32/R33 hierarchy: one primary CTA, separate catalogue route, B/D panels.
 const homeStart=html.indexOf('<template data-route="/">');
 const homeEnd=homeStart>=0?html.indexOf('</template>',homeStart):-1;
 if(homeEnd<=homeStart)throw new Error('R34 missing homepage template');
 const home=html.slice(homeStart,homeEnd);
 const checks=[
  ['<main class="home-v2 home-3d-page r32-home" id="main">','accessible homepage'],
  ['href="#/#solutions"','primary product anchor'],
  ['href="#/#purpose"','philosophy anchor'],
  ['class="r33-catalogue-strip"','all-products route'],
  ['class="r32-domain r32-domain-software"','technology domain'],
  ['class="r32-domain r32-domain-gis"','geospatial domain'],
  ['class="r32-solar-tools"','existing solar control disclosure']
 ];
 for(const [needle,label] of checks)if(!home.includes(needle))throw new Error('R34 missing '+label);
 if((home.match(/<h1\b/g)||[]).length!==1)throw new Error('R34 requires one homepage h1');
 return html;
}
module.exports={finishHomepage,FINAL_DESCRIPTION};
