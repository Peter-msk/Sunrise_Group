'use strict';
// R30 changed-impact QA: overview factual integrity + A/B/D visual continuity across display sizes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..','public');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const getTemplate=route=>(html.split('<template data-route="'+route+'">')[1]||'').split('</template>')[0];
const overview=getTemplate('/programs');
assert.ok(overview,'overview route exists');
assert.equal((overview.match(/data-design-axis="[BD]"/g)||[]).length,2,'exactly two overview design axes');
assert.ok(overview.includes('9개 플러그인 · 개발 완료 6개 · 개발 중 3개 →'),'QGIS owner catalogue status 9/6/3');
assert.ok(overview.includes('전체 16개 제품 · 상태 확인 중 3개 →'),'PC catalogue count is 16');
assert.ok(!overview.includes('10개 플러그인'),'no stale QGIS total');
assert.ok(!overview.includes('개발 완료 7개'),'no stale QGIS completion claim');
assert.ok(html.includes('<style id="sunrise-r30-polish">'),'second-pass CSS loaded');
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'34 routes retained');
assert.equal((html.match(/class="r28-workflow"/g)||[]).length,25,'25 product workflows retained');
assert.equal((html.match(/data-design-pillar="[ABD]"/g)||[]).length,3,'R29 A+B+D home preserved');
assert.equal((html.match(/<img\b/g)||[]).length,17,'no additional image delivery');
const photoAssets=fs.readdirSync(path.join(root,'assets','r28')).filter(x=>/\.(png|jpg|webp|gif)$/i.test(x));
assert.equal(photoAssets.length,23,'no new image assets');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const rel=pathname==='/'?'/index.html':pathname;
  const dest=path.resolve(root,'.'+rel);
  if(dest!==path.join(root,'index.html')&&!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(dest)||!fs.statSync(dest).isFile()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
  res.writeHead(200,{'Content-Type':types[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(dest).pipe(res);
});
const outputDir=process.env.SUNRISE_QA_ARTIFACT_DIR;
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const widths=[320,390,768,1024,1440,1920,2560];
  let navigations=0,detailChecks=0,images=0;
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:880},reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'#/programs',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs');
   const cards=page.locator('#page-outlet a.r05-portal[data-design-axis]');
   assert.equal(await cards.count(),2,'two product domain cards at '+width);
   assert.deepEqual(await cards.evaluateAll(list=>list.map(x=>x.dataset.designAxis)),['B','D'],'correct theme order at '+width);
   const box=await page.evaluate(()=>{
     const main=document.querySelector('#page-outlet .r19-portal-page');
     const cards=[...main.querySelectorAll('.r05-portal[data-design-axis]')];
     const rect=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}};
     return {documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,main:rect(main),cards:cards.map(rect),
       heroHeight:main.querySelector('.inner-hero').getBoundingClientRect().height,
       heading:main.querySelector('h1').textContent.trim(),
       status:cards.map(c=>c.querySelector('b')?.textContent?.trim()),
       axis:cards.map(c=>({text:c.querySelector('.r30-portal-axis')?.textContent,visible:getComputedStyle(c.querySelector('.r30-portal-axis')).display!=='none'}))};
   });
   assert.equal(box.heading,'프로그램과 QGIS 플러그인','overview hero text '+width);
   assert.ok(box.heroHeight>100&&box.heroHeight<500,'editorial hero not excessively tall at '+width+': '+box.heroHeight);
   assert.ok(box.documentWidth<=width+2,'no document horizontal overflow at '+width+': '+box.documentWidth);
   assert.ok(box.cards.every(x=>x.width>180&&x.height>180&&x.left>=-1&&x.right<=width+2),'product cards fit '+width+': '+JSON.stringify(box.cards));
   assert.ok(box.axis.every(x=>x.visible),'B/D overline visible '+width);
   assert.ok(box.status[0].includes('16개')&&box.status[1].includes('9개 플러그인')&&box.status[1].includes('개발 완료 6개'),'correct displayed totals '+width);
   if(width===390||width===1440){
     if(outputDir){
      const dest=path.join(outputDir,String(width));fs.mkdirSync(dest,{recursive:true});
      for(const img of await page.locator('#page-outlet .r05-portal img').all()){
        await img.scrollIntoViewIfNeeded();
        const ok=await img.evaluate(async img=>{await img.decode().catch(()=>{});return img.complete&&img.naturalWidth>0;});
        assert.ok(ok,'actual portal image decoded at '+width);images++;
      }
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:path.join(dest,'r30-program-overview.png'),fullPage:true,animations:'disabled'});
     }
     const destinations=['/programs/pc','/programs/qgis'];
     for(let i=0;i<2;i++){
       await cards.nth(i).click();
       await page.waitForFunction(route=>document.querySelector('#page-outlet')?.dataset.route===route,destinations[i]);
       assert.equal(new URL(page.url()).hash,'#'+destinations[i],'domain link '+i+' at '+width);
       const details=await page.evaluate(()=>({h1:document.querySelector('#page-outlet h1')?.textContent?.trim(),counter:[...document.querySelectorAll('#page-outlet .r05-branch-nav span')].map(n=>n.textContent.trim())}));
       assert.deepEqual(details.counter,['16','9'],'PC/QGIS tab totals remain correct at '+width);
       if(i===0)assert.equal(details.h1,'PC 프로그램');
       if(i===1)assert.equal(details.h1,'QGIS 플러그인');
       navigations++;
       if(outputDir){
        await page.locator('#page-outlet .inner-hero').scrollIntoViewIfNeeded();
        const dest=path.join(outputDir,String(width));
        await page.screenshot({path:path.join(dest,i?'r30-qgis-catalog.png':'r30-pc-catalog.png'),fullPage:true,animations:'disabled'});
       }
       await page.goto(origin+'#/programs',{waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs');
     }
     for(const [route,key] of [['/projects/pdf-pro','document'],['/projects/3d-map','relief']]){
       await page.goto(origin+'#'+route,{waitUntil:'domcontentloaded'});
       await page.waitForFunction(route=>document.querySelector('#page-outlet')?.dataset.route===route,route);
       const data=await page.evaluate(()=>{
         const main=document.querySelector('#page-outlet main'),workflow=main.querySelector('.r28-workflow'),style=workflow&&getComputedStyle(workflow);
         return {family:main.dataset.designFamily,workflow:!!workflow,border:style?.borderTopWidth,borderColor:style?.borderTopColor,background:getComputedStyle(main).backgroundColor};
       });
       assert.equal(data.family,key,'correct family on '+route);
       assert.equal(data.workflow,true,'workflow exists on '+route);
       assert.equal(data.border,'3px','family border applied on '+route+' at '+width);
       detailChecks++;
       if(outputDir){
        const dest=path.join(outputDir,String(width));
        await page.locator('#page-outlet .r28-workflow').scrollIntoViewIfNeeded();
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:path.join(dest,key==='document'?'r30-pc-detail.png':'r30-qgis-detail.png'),fullPage:true,animations:'disabled'});
       }
     }
   }
   assert.deepEqual(errors,[],'no JavaScript errors '+width);
   console.log('PASS R30 overview responsive '+width+'px; QGIS 9 / complete 6 / active 3');
   await context.close();
  }
  console.log('R30 QA PASS: 7 viewport widths; '+navigations+' catalogue navigations; '+detailChecks+' domain detail accent checks; '+images+' decoded overview screenshots; R29 home / 34 routes / 25 product workflows kept.');
 }finally{if(browser)await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
