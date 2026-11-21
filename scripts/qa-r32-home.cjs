'use strict';
// R32 changed-impact QA. Real DOM/CSS screenshots + route navigation + solar controls + image provenance.
// No regression reruns of unrelated R31 product workflow internals.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..','public'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const routes=[...html.matchAll(/<template data-route="([^"]+)">/g)].map(m=>m[1]);
const start=html.indexOf('<template data-route="/">'),end=html.indexOf('</template>',start);
assert.ok(start>=0&&end>start,'homepage template exists');
const home=html.slice(start,end);
assert.equal(routes.length,34,'34 routes retained');
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25,'25 workflows retained');
assert.equal((html.match(/class="r31-workflow-jump"/g)||[]).length,25,'25 detail shortcuts retained');
assert.equal((html.match(/<a class="catalog-line[^"]*" href="#\/projects\//g)||[]).length,25,'25 catalogue cards retained');
assert.equal((html.match(/<img\b/g)||[]).length,19,'17 previous image tags plus 2 reused home static assets');
assert.equal(fs.readdirSync(path.join(root,'assets','r28')).filter(f=>/\.(png|jpg|jpeg|webp|gif)$/i.test(f)).length,23,'23 hashed image assets unchanged');
assert.ok(html.includes('9개 플러그인 · 개발 완료 6개 · 개발 중 3개'),'QGIS verified counts retained');
assert.ok(home.includes('class="r32-home"')||home.includes('r32-home"'),'new home is present');
assert.ok(home.includes('id="solutions"'),'main product anchor');
assert.ok(home.includes('id="purpose"'),'original deep link preserved');
assert.ok(home.includes('class="r19-cinema-links"'),'existing homepage chapter-nav mount remains');
assert.ok(home.includes('class="r32-ethos r19-values-section"'),'existing values chapter hook preserved');
assert.ok(home.includes('class="r32-future r19-end"'),'existing future chapter hook preserved');

assert.ok(home.includes('class="r32-solar-tools"'),'collapsible original solar controls');
assert.ok(home.includes('id="r27-solar-help"'),'solar accessibility guide');
assert.equal((home.match(/<h1\b/g)||[]).length,1,'one accessible h1');
assert.equal((home.match(/class="r23-stage"/g)||[]).length,1,'one original solar stage');
assert.equal((home.match(/class="r27-solar-controls"/g)||[]).length,1,'one original solar controller');
assert.equal((home.match(/class="r32-domain /g)||[]).length,2,'two product-focused entry bands');
assert.ok(!home.includes('class="r29-triad"'),'old triad cards removed');
assert.ok(home.includes('src="/assets/r28/08abfc2a8d30ae14e29a9816.png"'),'real product screenshot reused');
assert.ok(home.includes('src="/assets/r28/35958198c701f4c84d64911c.webp"'),'GIS explanatory image reused');
assert.ok(home.includes('실제 QGIS 실행 화면 아님'),'GIS model provenance preserved');
assert.ok(html.includes('id="sunrise-r32-home"'),'R32 style owner');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const p=url.pathname==='/'?'/index.html':url.pathname;
 const dest=path.resolve(root,'.'+p);
 if(dest!==path.join(root,'index.html')&&!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dest)||!fs.statSync(dest).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}[path.extname(dest)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});
 fs.createReadStream(dest).pipe(res);
});
const out=process.env.SUNRISE_QA_ARTIFACT_DIR;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  let domainNav=0,decoded=0;
  for(const width of [320,390,768,1024,1440,1920,2560]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:1});
   const page=await context.newPage();
   const jsErrors=[];
   page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
   const result=await page.evaluate(()=>{
    const main=document.querySelector('#page-outlet main.r32-home');
    const hero=main.querySelector('.r32-hero');
    const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,width:r.width,height:r.height}};
    const links=[...main.querySelectorAll('a[href^="#/"]')].map(a=>a.getAttribute('href'));
    return {main:!!main,docWidth:document.documentElement.scrollWidth,width:innerWidth,
      heading:main.querySelector('h1')?.textContent?.trim(),hero:box(hero),heroCopy:box(main.querySelector('.r32-hero-copy')),
      solar:box(main.querySelector('.r23-stage')),solutions:box(main.querySelector('.r32-solutions')),
      twoProducts:[...main.querySelectorAll('a.r32-domain')].map(box),
      themeAxis:[...main.querySelectorAll('a.r32-domain')].map(a=>a.dataset.designAxis),
      toolsOpen:main.querySelector('.r32-solar-tools')?.open,
      toolsButtons:main.querySelectorAll('.r27-solar-buttons button').length,
      repeatedHeading:(main.textContent.match(/현장에서 출발해,기술로 연결합니다/g)||[]).length,
      links,heroLayout:getComputedStyle(main.querySelector('.r32-hero-inner')).gridTemplateColumns,
      solarCanvas:main.querySelector('canvas')?.getBoundingClientRect().width};
   });
   assert.equal(result.main,true,'new home loads at '+width);
   assert.equal(result.heading,'Sunrise Group','semantic brand title at '+width);
   assert.ok(result.docWidth<=width+2,'no horizontal overflow '+width+' '+result.docWidth);
   assert.deepEqual(result.themeAxis,['B','D'],'integrated B/D product focus at '+width);
   assert.ok(result.solar.width>220&&result.solar.height>160,'solar geometry '+width+': '+JSON.stringify(result.solar));
   assert.ok(result.solar.left>=-1&&result.solar.right<=width+2,'solar fits viewport '+width+': '+JSON.stringify(result.solar));
   assert.ok(result.hero.height<1450,'no excessive first-fold hero '+width+': '+result.hero.height);
   assert.ok(result.twoProducts.every(x=>x.width>=250&&x.left>=-1&&x.right<=width+2),'domain bands fit '+width+': '+JSON.stringify(result.twoProducts));
   assert.equal(result.toolsOpen,false,'solar controls are compact by default '+width);
   assert.equal(result.toolsButtons,4,'original four solar controls preserved '+width);
   assert.equal(result.repeatedHeading,0,'duplicate marketing copy removed '+width);
   for(const href of ['#/programs','#/about','#/programs/pc','#/programs/qgis','#/philosophy','#/future','#/#solutions']){
    assert.ok(result.links.includes(href),'main link available '+href+' at '+width);
   }
   const details=page.locator('#page-outlet details.r32-solar-tools');
   await details.locator('summary').click();
   assert.equal(await details.getAttribute('open'),'','native solar disclosure opens '+width);
   assert.equal(await details.locator('.r27-solar-buttons button').count(),4,'original tool controls accessible '+width);
   await details.locator('summary').click();
   assert.equal(await details.getAttribute('open'),null,'native disclosure closes '+width);
   if([390,768,1440].includes(width)){
     const imgs=await page.locator('#page-outlet .r32-domain-figure img').all();
     assert.equal(imgs.length,2,'two grounded illustrations at '+width);
     for(const img of imgs){
       await img.scrollIntoViewIfNeeded();
       const valid=await img.evaluate(async el=>{
         await el.decode().catch(()=>{});
         return el.complete&&el.naturalWidth>0&&el.getAttribute('alt')?.length>8;
       });
       assert.ok(valid,'real static asset loads with alt text '+width);
       decoded++;
     }
     if(out){
       const dest=path.join(out,String(width));fs.mkdirSync(dest,{recursive:true});
       await page.evaluate(()=>window.scrollTo(0,0));
       await page.screenshot({path:path.join(dest,'r32-homepage-full.png'),fullPage:true,animations:'disabled'});
     }
   }
   if(width===390||width===1440){
     const panels=['#/programs/pc','#/programs/qgis'];
     for(const hash of panels){
       await page.locator('#page-outlet a.r32-domain[href="'+hash+'"]').click();
       const target=hash.slice(1);
       await page.waitForFunction(route=>document.querySelector('#page-outlet')?.dataset.route===route,target);
       assert.equal(new URL(page.url()).hash,hash,'functional product domain navigation '+hash+' at '+width);
       domainNav++;
       await page.goto(origin,{waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
     }
     await page.locator('#page-outlet .r32-hero-primary').click();
     await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs');
     assert.equal(new URL(page.url()).hash,'#/programs','hero primary navigation '+width);
     await page.goto(origin,{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
     await page.locator('#page-outlet .r32-hero-foot a[href="#/#solutions"]').click();
     await page.waitForFunction(()=>location.hash==='#/#solutions');
     await page.waitForFunction(()=>{const e=document.querySelector('#page-outlet #solutions');if(!e)return false;const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
   }
   assert.deepEqual(jsErrors,[],'no page JS exception at '+width);
   await context.close();
   console.log('R32 PASS viewport '+width+'px: unified hero, 2 product domains, original solar controls, no horizontal overflow');
  }
  console.log('R32 QA PASS: 7 viewports, '+domainNav+' real B/D navigations, 2 primary CTA navigations, 2 deep anchor navigations, '+decoded+' image decodes, 34 routes + 25 details preserved');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
