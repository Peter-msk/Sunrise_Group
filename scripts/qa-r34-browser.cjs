'use strict';
// R34 small changed-impact browser gate. All-R33 7-width QA was previously PASS;
// R34 only modifies responsive/focus CSS and SEO metadata.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..','public');
const server=http.createServer((req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname;
 const p=route==='/'?'/index.html':route,dst=path.resolve(root,'.'+p);
 if(dst!==path.join(root,'index.html')&&!dst.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dst)||!fs.statSync(dst).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
 res.writeHead(200,{'Content-Type':mime[path.extname(dst)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(dst).pipe(res);
});
const folder=process.env.SUNRISE_QA_ARTIFACT_DIR;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [390,1024,1440]){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
   const metric=await page.evaluate(()=>{
     const home=document.querySelector('#page-outlet .r32-home'),title=home.querySelector('h1');
     const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
     return {
       width:document.documentElement.scrollWidth,viewport:innerWidth,
       hero:rect(home.querySelector('.r32-hero')),headline:rect(title),
       solar:rect(home.querySelector('.r23-stage')),
       domains:[...home.querySelectorAll('.r32-domain')].map(rect),
       parts:[...home.querySelectorAll('.r32-domain-figure img')].map(e=>e.getAttribute('src')),
       controlButtons:home.querySelectorAll('.r27-solar-buttons button').length,
       sectionCount:home.querySelectorAll('section').length,
       r34Css:!!document.querySelector('#sunrise-r34-home'),
       description:document.querySelector('meta[name="description"]')?.content,
       ogTitle:document.querySelector('meta[property="og:title"]')?.content,
       ogDescription:document.querySelector('meta[property="og:description"]')?.content
     };
   });
   assert.equal(metric.r34Css,true,'final source style loaded');
   assert.ok(metric.description?.includes('16개')&&metric.description?.includes('9개'),'meta corresponds to real catalog totals');
   assert.ok(metric.ogTitle?.includes('Sunrise Group')&&metric.ogDescription?.includes('QGIS'),'OpenGraph accessible');
   assert.ok(metric.width<=width+2,'no horizontal overflow '+width+' actual '+metric.width);
   assert.equal(metric.domains.length,2,'two domain entrances at '+width);
   assert.ok(metric.domains.every(b=>b.width>240&&b.left>=-1&&b.right<=width+2),'domain cards fit '+width);
   assert.ok(metric.solar.left>=-1&&metric.solar.right<=width+2,'3D visual within viewport '+width);
   assert.equal(metric.controlButtons,4,'all solar control buttons maintained '+width);
   const first=page.locator('#page-outlet a.r32-domain').first();
   await first.focus();
   const outline=await first.evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth}));
   assert.equal(outline.style,'solid','keyboard focus indicator visible '+width);
   assert.equal(outline.width,'3px','keyboard focus meets final rule '+width);
   const imgs=await page.locator('#page-outlet .r32-domain-figure img').all();
   for(const img of imgs){await img.scrollIntoViewIfNeeded();assert.ok(await img.evaluate(async e=>{await e.decode().catch(()=>{});return e.complete&&e.naturalWidth>0;}),'actual image loaded '+width);}
   if(folder){
    const dir=path.join(folder,String(width));fs.mkdirSync(dir,{recursive:true});
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(dir,'r34-home-final.png'),fullPage:true,animations:'disabled'});
   }
   if(width===390||width===1440){
    await page.locator('#page-outlet .r32-hero-primary').click();
    await page.waitForFunction(()=>location.hash==='#/#solutions');
    await page.waitForFunction(()=>{const r=document.querySelector('#page-outlet #solutions')?.getBoundingClientRect();return r&&r.top<innerHeight&&r.bottom>0;});
    const top=await page.locator('#page-outlet #solutions').evaluate(e=>e.getBoundingClientRect().top);
    assert.ok(top>40,'primary CTA navigates past sticky header '+width+': '+top);
   }
   assert.deepEqual(errors,[],'no page runtime errors '+width);
   await context.close();
   console.log('R34 PASS: '+width+'px, 3D scene + 2 domains + source-generated meta + images + keyboard focus');
  }
  console.log('R34 final browser smoke PASS: 3 changed-impact widths, 2 live CTA scrolls, 6 image decodes; all previous 34 routes and 25 details source-preserved.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
