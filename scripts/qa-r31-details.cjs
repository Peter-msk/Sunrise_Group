'use strict';
// R31 changed-impact QA: all 25 real product routes, anchor navigation, mobile/desktop geometry, and A+B+D continuity.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..','public');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const products=[...html.matchAll(/<template data-route="(\/projects\/[^"]+)">([\s\S]*?)<\/template>/g)].map(m=>({route:m[1],markup:m[2]}));
assert.equal(products.length,25,'25 product templates');
const families={};
for(const {route,markup} of products){
 assert.ok(markup.includes('class="r31-workflow-jump" href="#'+route+'#workflow"'),'workflow link '+route);
 assert.equal((markup.match(/class="r28-workflow" id="workflow" tabindex="-1"/g)||[]).length,1,'one focusable workflow anchor '+route);
 assert.equal((markup.match(/class="r31-workflow-jump"/g)||[]).length,1,'one jump shortcut '+route);
 assert.ok(markup.includes('aria-label="제품 안내 바로가기"'),'accessible section nav '+route);
 const family=(markup.match(/data-design-family="([^"]+)"/)||[])[1];
 assert.ok(family,'product family '+route);
 families[family]=(families[family]||0)+1;
}
assert.equal(Object.keys(families).length,8,'all eight design families represented');
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'no route deleted');
assert.equal((html.match(/<a class="catalog-line[^"]*" href="#\/projects\//g)||[]).length,25,'25 existing catalog links');
assert.equal((html.match(/data-design-pillar="[ABD]"/g)||[]).length,3,'A+B+D home preserved');
assert.equal((html.match(/data-design-axis="[BD]"/g)||[]).length,2,'B/D overview preserved');
assert.ok(html.includes('9개 플러그인 · 개발 완료 6개 · 개발 중 3개'),'QGIS counts preserved');
assert.ok(html.includes('id="sunrise-r31-polish"'),'R31 CSS embedded');
assert.equal((html.match(/<img\b/g)||[]).length,17,'R28 image contract unchanged');
const assetDir=path.join(root,'assets','r28');
assert.equal(fs.readdirSync(assetDir).filter(x=>/\.(png|jpg|webp|gif)$/i.test(x)).length,23,'23 R28 static images unchanged');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const p=pathname==='/'?'/index.html':pathname;
 const dest=path.resolve(root,'.'+p);
 if(dest!==path.join(root,'index.html')&&!dest.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dest)||!fs.statSync(dest).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
 res.writeHead(200,{'Content-Type':mime[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(dest).pipe(res);
});
const screenshotDir=process.env.SUNRISE_QA_ARTIFACT_DIR;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  let checked=0,clicked=0;
  const samples=new Set(['/projects/pdf-pro','/projects/finder','/projects/qgis-tool','/projects/survey-designer']);
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   for(const item of products){
    const route=item.route;
    await page.goto(origin+'#'+route,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(expected=>document.querySelector('#page-outlet')?.dataset.route===expected,route);
    const nav=page.locator('#page-outlet nav.r19-product-jump');
    const link=nav.locator('a.r31-workflow-jump');
    assert.equal(await link.count(),1,'navigable shortcut '+route+' at '+width);
    const layout=await page.evaluate(()=>{
      const main=document.querySelector('#page-outlet main.sg3-product');
      const flow=main.querySelector('#workflow');
      const jump=main.querySelector('a.r31-workflow-jump');
      const rect=jump.getBoundingClientRect();
      const style=getComputedStyle(main.querySelector('nav.r19-product-jump'));
      return {width:document.documentElement.scrollWidth,viewport:innerWidth,jumpRect:{width:rect.width,height:rect.height,left:rect.left,right:rect.right},navDisplay:style.display,navWrap:style.flexWrap,workflow:!!flow,tabindex:flow?.getAttribute('tabindex'),family:main.dataset.designFamily,accent:getComputedStyle(main).getPropertyValue('--r30-domain')};
    });
    assert.equal(layout.workflow,true,'workflow visible in live route '+route);
    assert.equal(layout.tabindex,'-1','workflow programmable focus '+route);
    assert.ok(layout.width<=width+2,'document horizontal overflow '+route+' at '+width+': '+layout.width);
    assert.ok(layout.jumpRect.width>=44&&layout.jumpRect.height>=44,'touch target usable '+route+' at '+width+': '+JSON.stringify(layout.jumpRect));
    assert.ok(layout.jumpRect.left>=-1&&layout.jumpRect.right<=width+1,'jump link within viewport '+route+' at '+width);
    assert.ok(layout.navDisplay==='flex'&&layout.navWrap==='wrap','responsive nav wraps '+route+' at '+width);
    assert.ok(layout.accent.trim().length>0,'domain accent inherited '+route);
    if(screenshotDir&&samples.has(route)){
     const dir=path.join(screenshotDir,String(width));
     fs.mkdirSync(dir,{recursive:true});
     const img=page.locator('#page-outlet .r20-product-stage img');
     if(await img.count()){await img.first().scrollIntoViewIfNeeded();await img.first().evaluate(async el=>{await el.decode().catch(()=>{});});}
     await page.evaluate(()=>window.scrollTo(0,0));
     await page.screenshot({path:path.join(dir,route.split('/').pop()+'-before-workflow.png'),fullPage:true,animations:'disabled'});
    }
    await link.click();
    await page.waitForFunction(expected=>location.hash===expected,'#'+route+'#workflow');
    await page.waitForFunction(()=>{const e=document.querySelector('#page-outlet #workflow');const r=e?.getBoundingClientRect();return !!r&&r.top<innerHeight&&r.bottom>0;});
    const target=await page.locator('#page-outlet #workflow').evaluate(el=>({id:el.id,title:el.querySelector('h3')?.textContent?.trim(),top:el.getBoundingClientRect().top}));
    assert.equal(target.title,'작업 흐름','correct target heading '+route);
    assert.ok(target.top>=-10&&target.top<900,'anchor reached visible target '+route+' at '+width+': '+target.top);
    checked++;clicked++;
   }
   assert.deepEqual(errors,[],'JS runtime clean at '+width);
   await context.close();
   console.log('R31 PASS '+width+'px: 25/25 product route layouts, 25/25 workflow clicks and reached targets');
  }
  console.log('R31 PASS: '+checked+' detail viewport visits, '+clicked+' working internal flow shortcuts, 8 design families, 34 routes, 25 catalog entries preserved.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
