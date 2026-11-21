'use strict';
// R33 changed-impact QA: direct homepage discovery, distinct secondary navigation, scroll occlusion, mobile readability.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..','public'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('<template data-route="/">'),finish=html.indexOf('</template>',start);
assert.ok(start>=0&&finish>start,'R33 homepage template exists');
const home=html.slice(start,finish);
const count=(s,pattern)=>(s.match(pattern)||[]).length;
assert.equal(count(html,/<template data-route="/g),34,'34 existing routes');
assert.equal(count(html,/class="r28-workflow" id="workflow"/g),25,'25 existing detailed workflows');
assert.equal(count(html,/class="r31-workflow-jump"/g),25,'25 existing detail links');
assert.equal(count(home,/class="r32-domain /g),2,'two product families');
assert.equal(count(home,/class="r33-catalogue-strip"/g),1,'separate all-products entry');
assert.equal(count(home,/class="r23-stage"/g),1,'existing solar stage');
assert.equal(count(home,/class="r27-solar-controls"/g),1,'original solar control elements');
assert.ok(home.includes('class="r32-hero-primary" href="#/#solutions"'),'hero directly opens the current page products');
assert.ok(home.includes('href="#/#purpose">개발 원칙 보기'),'hero footer goes to philosophy');
assert.ok(home.includes('class="r33-catalogue-strip"')&&home.includes('href="#/programs">전체 제품 목록 보기'),'full catalogue remains accessible');
assert.ok(!home.includes('href="#/#solutions">솔루션 분야 보기'),'no duplicated product summary CTA');
assert.ok(html.includes('id="sunrise-r33-home"'),'R33 CSS owner');
assert.ok(html.includes('9개 플러그인 · 개발 완료 6개 · 개발 중 3개'),'QGIS count preserved');
const server=http.createServer((req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname,p=route==='/'?'/index.html':route,dest=path.resolve(root,'.'+p);
 if(dest!==path.join(root,'index.html')&&!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dest)||!fs.statSync(dest).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
 res.writeHead(200,{'Content-Type':mime[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(dest).pipe(res);
});
const dir=process.env.SUNRISE_QA_ARTIFACT_DIR;
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const url='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  let heroClicks=0,purposeClicks=0,allClicks=0;
  for(const width of [320,390,768,1024,1440,1920,2560]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
   const metrics=await page.evaluate(()=>{
    const home=document.querySelector('#page-outlet main.r32-home'),products=home.querySelector('#solutions'),
       philosophy=home.querySelector('#purpose'),strip=home.querySelector('.r33-catalogue-strip'),
       rect=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,width:b.width,height:b.height}};
    return {
      viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
      products:rect(products),philosophy:rect(philosophy),strip:rect(strip),
      heroHref:home.querySelector('.r32-hero-primary').getAttribute('href'),
      footHref:home.querySelector('.r32-hero-foot .r19-cinema-links > a').getAttribute('href'),
      catalogueHref:strip.querySelector('a').getAttribute('href'),
      scrollMarginProducts:parseFloat(getComputedStyle(products).scrollMarginTop),
      scrollMarginPhilosophy:parseFloat(getComputedStyle(philosophy).scrollMarginTop),
      catalogueTouch:rect(strip.querySelector('a')),futureTouch:rect(home.querySelector('.r32-future a')),
      fontProduct:parseFloat(getComputedStyle(home.querySelector('.r32-domain-copy p')).fontSize),
      fontValues:parseFloat(getComputedStyle(home.querySelector('.r32-values article p')).fontSize),
      domainRects:[...home.querySelectorAll('.r32-domain')].map(rect),
      images:[...home.querySelectorAll('.r32-domain-figure img')].map(e=>e.getAttribute('src'))
    };
   });
   assert.ok(metrics.documentWidth<=width+2,'no full-page horizontal overflow '+width+' '+metrics.documentWidth);
   assert.equal(metrics.heroHref,'#/#solutions','hero focus on product selection '+width);
   assert.equal(metrics.footHref,'#/#purpose','footer leads to development principles '+width);
   assert.equal(metrics.catalogueHref,'#/programs','full listing remains available '+width);
   assert.ok(metrics.scrollMarginProducts>=60&&metrics.scrollMarginPhilosophy>=60,'scroll target clears sticky header '+width);
   assert.ok(metrics.catalogueTouch.height>=44&&metrics.futureTouch.height>=44,'accessible link vertical hitbox '+width);
   assert.ok(metrics.domainRects.every(x=>x.width>240&&x.left>=-1&&x.right<=width+2),'domain responsive bounds '+width);
   if(width<=760){
     assert.ok(metrics.fontProduct>=14,'product explanatory text mobile legible '+width);
     assert.ok(metrics.fontValues>=13,'philosophy descriptions legible '+width);
   }
   if([390,768,1440].includes(width)&&dir){
    const dest=path.join(dir,String(width));fs.mkdirSync(dest,{recursive:true});
    for(const pic of await page.locator('#page-outlet .r32-domain-figure img').all()){
      await pic.scrollIntoViewIfNeeded();
      assert.ok(await pic.evaluate(async img=>{await img.decode().catch(()=>{});return img.complete&&img.naturalWidth>0;}),'reused image decodes '+width);
    }
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(dest,'r33-homepage-full.png'),fullPage:true,animations:'disabled'});
   }
   const clickAndCheck=async(href,targetId)=>{
    await page.locator('#page-outlet a[href="'+href+'"]').first().click();
    await page.waitForFunction(hash=>location.hash===hash,href);
    await page.waitForFunction(id=>{
     const el=document.querySelector('#page-outlet #'+id);if(!el)return false;
     const b=el.getBoundingClientRect();return b.top<innerHeight&&b.bottom>0;
    },targetId);
    const locationTop=await page.locator('#page-outlet #'+targetId).evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(locationTop>=44&&locationTop<page.viewportSize().height,'deep anchor visible below header '+href+' '+width+' top '+locationTop);
    assert.equal(await page.locator('#page-outlet main.r32-home').count(),1,'deep link remains on homepage '+width);
   };
   await clickAndCheck('#/#solutions','solutions');heroClicks++;
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
   await page.locator('#page-outlet .r32-hero-foot .r19-cinema-links > a[href="#/#purpose"]').click();
   await page.waitForFunction(()=>location.hash==='#/#purpose');
   await page.waitForFunction(()=>{
    const e=document.querySelector('#page-outlet #purpose');if(!e)return false;
    const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;
   });
   const purposeTop=await page.locator('#page-outlet #purpose').evaluate(e=>e.getBoundingClientRect().top);
   assert.ok(purposeTop>=44&&purposeTop<900,'philosophy anchor above sticky header '+width+' '+purposeTop);
   purposeClicks++;
   if(width===390||width===1440){
     await page.goto(url,{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
     await page.locator('#page-outlet .r33-catalogue-strip a[href="#/programs"]').click();
     await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs');
     assert.equal(new URL(page.url()).hash,'#/programs','full listing route '+width);
     allClicks++;
   }
   assert.deepEqual(errors,[],'no JS exceptions '+width);
   await ctx.close();
   console.log('R33 PASS '+width+'px: direct solution and principle anchors, readable type, no overflow');
  }
  console.log('R33 QA PASS '+heroClicks+' product scrolls / '+purposeClicks+' principle scrolls / '+allClicks+' full-catalogue routes; 7 display widths, 34 routes, 25 workflows preserved.');
 }finally{if(browser)await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
