'use strict';
// R35: user-provided app screenshots as source-owned WebP, no generative images.
require('./assemble-r34.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public','index.html');
const sourceDir=path.join(root,'source','r35','screenshots'),assetDir=path.join(root,'public','assets','r35');
const list=JSON.parse(fs.readFileSync(path.join(root,'source','r35','screenshots.json'),'utf8')).screenshots;
const ok=(v,msg)=>{if(!v)throw Error('R35: '+msg)};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const reEsc=s=>s.replace(/[|\\{}()[\]^$+*?.]/g,'\\$&');
ok(list.length===7,'seven source images');
fs.mkdirSync(assetDir,{recursive:true});
let html=fs.readFileSync(out,'utf8');
function patch(route,fn){
 const mark='<template data-route="'+route+'">',i=html.indexOf(mark),j=html.indexOf('</template>',i);
 ok(i>=0&&j>i,'route '+route);
 const old=html.slice(i,j+11),next=fn(old);
 ok(next.startsWith(mark)&&next.endsWith('</template>'),'template integrity '+route);
 html=html.slice(0,i)+next+html.slice(j+11);
}
function screenshot(m){
 const src='/assets/r35/'+m.file;
 return '<section class="r12-hero-proof r20-visual-stage r35-real-screenshot" id="screens"><h2>실제 실행 화면</h2><figure>'+
 '<a aria-label="'+esc(m.name)+' 실행 화면 크게 보기 (새 창)" class="screen-full-link" data-image="true" href="'+src+'" target="_blank" rel="noopener noreferrer">'+
 '<img class="r28-optimized-image r35-capture" alt="'+esc(m.alt)+'" src="'+src+'" width="'+m.width+'" height="'+m.height+'" loading="eager" decoding="async" fetchpriority="high">'+
 '<span>화면 크게 보기 ↗</span></a><figcaption>사용자가 제공한 '+esc(m.name)+' '+esc(m.version)+' 실제 실행 화면 · 2026.11.21 촬영본.</figcaption></figure></section>';
}
for(const m of list){
 const source=path.join(sourceDir,m.file),target=path.join(assetDir,m.file);
 ok(fs.existsSync(source),'asset '+m.file);
 const bytes=fs.readFileSync(source);
 ok(bytes.slice(0,4).toString('ascii')==='RIFF'&&bytes.slice(8,12).toString('ascii')==='WEBP','WebP signature '+m.file);
 ok(crypto.createHash('sha256').update(bytes).digest('hex')===m.sha256,'asset checksum '+m.file);
 fs.copyFileSync(source,target);
 const uri='/assets/r35/'+m.file;
 patch(m.route,part=>{
  let s=part;
  if(m.type==='replace'){
   ok(s.split(m.old).length===3,'old image link and src '+m.route);
   s=s.split(m.old).join(uri);
   const img=s.match(new RegExp('<img\\b[^>]*src="'+reEsc(uri)+'"[^>]*>'));
   ok(!!img,'previous real image '+m.route);
   let updated=img[0].replace(/height="\d+"/,'height="'+m.height+'"').replace(/width="\d+"/,'width="'+m.width+'"').replace(/alt="[^"]*"/,'alt="'+esc(m.alt)+'"');
   s=s.replace(img[0],updated);
   const caption=s.match(/<figcaption>[\s\S]*?<\/figcaption>/);
   ok(!!caption,'real image caption '+m.route);
   s=s.replace(caption[0],'<figcaption>사용자가 제공한 '+esc(m.name)+' '+esc(m.version)+' 실제 실행 화면 · 2026.11.21 촬영본.</figcaption>');
  }else{
   const scene=new RegExp('<figure class="sg3-scene r04-scene r20-visual-stage" data-scene="'+reEsc(m.route)+'">[\\s\\S]*?<\\/figure>');
   ok(scene.test(s),'old concept scene '+m.route);
   s=s.replace(scene,screenshot(m));
   ok(s.includes('r19-model-hero'),'old model hero '+m.route);
   s=s.replace('r19-model-hero','r19-proof-hero');
   const nav='<nav aria-label="제품 안내 바로가기" class="r07-product-sections r19-product-jump">';
   ok(s.split(nav).length===2,'detail nav '+m.route);
   s=s.replace(nav,nav+'<a href="#'+m.route+'#screens">실제 실행 화면</a>');
  }
  ok(s.includes('id="screens"')&&s.includes(uri),'real image + anchor '+m.route);
  return s;
 });
 patch('/programs/pc',part=>{
  const cardRe=new RegExp('<a class="catalog-line[^"]*" href="#'+reEsc(m.route)+'">[\\s\\S]*?<\\/a>');
  const card=part.match(cardRe);
  ok(!!card,'catalogue entry '+m.route);
  let row=card[0];
  const image='<div class="sg3-product-object r04-thumb r35-photo-thumb"><img alt="'+esc(m.alt)+'" src="'+uri+'" width="'+m.width+'" height="'+m.height+'" loading="lazy" decoding="async"></div>';
  const prev=row.match(/<div class="sg3-product-object r04-thumb">[\s\S]*?<\/div>/);
  if(prev)row=row.replace(prev[0],image);
  else{
   ok(row.includes('r08-text-row'),'text-only catalogue entry '+m.route);
   row=row.replace('r08-text-row','r35-photo-product');
   const hook='<div class="catalog-line-name">';
   ok(row.split(hook).length===2,'catalogue label '+m.route);
   row=row.replace(hook,image+hook);
  }
  ok(row.includes(image),'photo inserted '+m.route);
  return part.replace(card[0],row);
 });
}
const css=fs.readFileSync(path.join(root,'source','r35','polish.css'),'utf8');
ok(!/<\/style/i.test(css),'CSS safety');
const hook='<style id="sunrise-r34-home">',si=html.indexOf(hook),ei=html.indexOf('</style>',si);
ok(si>=0&&ei>si,'R34 stylesheet hook');
html=html.slice(0,ei+8)+'<style id="sunrise-r35-screens">'+css+'</style>'+html.slice(ei+8);
const count=r=>(html.match(r)||[]).length;
ok(count(/<template data-route="/g)===34,'34 routes');
ok(count(/class="r28-workflow" id="workflow"/g)===25,'25 workflows');
ok(count(/class="r31-workflow-jump"/g)===25,'25 workflow shortcuts');
ok(count(/class="sg3-product-object r04-thumb r35-photo-thumb"/g)===7,'7 product catalogue images');
ok(count(/class="r12-hero-proof r20-visual-stage r35-real-screenshot"/g)===4,'4 concept panels replaced');
const temp=path.join(root,'public','.index-r35.tmp');
try{fs.writeFileSync(temp,html,'utf8');fs.renameSync(temp,out);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
console.log('R35: 7 actual product captures on 7 detail pages and 7 catalogue cards; 4 previous concept scenes replaced.');
console.log('R35: '+Buffer.byteLength(html)+' HTML bytes, 34 routes, 25 workflows, source images 7.');
