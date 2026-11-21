'use strict';
// R35 changed-impact test: seven user screenshots, catalogue thumbs, links, real image bytes.
// R34 unrelated tests are not redundantly repeated.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'public');
const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
const list=JSON.parse(fs.readFileSync(path.join(root,'source','r35','screenshots.json'),'utf8')).screenshots;
assert.equal(list.length,7);
const getRoute=route=>{
 const start=html.indexOf('<template data-route="'+route+'">'),end=html.indexOf('</template>',start);
 assert.ok(start>=0&&end>start,'route exists '+route);
 return html.slice(start,end);
};
for(const m of list){
 const asset=path.join(folder,'assets','r35',m.file);
 assert.ok(fs.existsSync(asset),'web screenshot copied '+m.file);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex'),m.sha256,'exact user asset bytes '+m.file);
 const page=getRoute(m.route),catalogue=getRoute('/programs/pc');
 assert.ok(page.includes('/assets/r35/'+m.file),'real screenshot linked '+m.route);
 assert.ok(page.includes('실제 실행 화면'),'true screenshot label '+m.route);
 assert.ok(page.includes('id="screens"'),'deep-linkable screenshot '+m.route);
 assert.ok(catalogue.includes('src="/assets/r35/'+m.file+'"'),'thumbnail in PC catalogue '+m.route);
 assert.ok(!page.includes('기능 설명용 모션 · 실제 실행 화면 아님'),'old false screenshot disclaimer removed '+m.route);
 if(m.type==='scene')assert.ok(!page.includes('data-scene="'+m.route+'"'),'old concept scene replaced '+m.route);
}
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'all 34 routes');
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25,'25 original workflow contents retained');
assert.equal((html.match(/class="r31-workflow-jump"/g)||[]).length,25,'25 workflow links retained');
assert.equal((getRoute('/programs/pc').match(/class="sg3-product-object r04-thumb r35-photo-thumb"/g)||[]).length,7,'all 7 catalogue photos');
assert.ok(html.includes('id="sunrise-r35-screens"'),'new photo presentation CSS');
const server=http.createServer((req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname,rel=p==='/'?'/index.html':p,dest=path.resolve(folder,'.'+rel);
 if(dest!==path.join(folder,'index.html')&&!dest.startsWith(folder+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dest)||!fs.statSync(dest).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
 res.writeHead(200,{'Content-Type':mime[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(dest).pipe(res);
});
const shots=process.env.SUNRISE_QA_ARTIFACT_DIR;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const site='http://127.0.0.1:'+server.address().port+'/';
 let browser,visits=0;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',x=>errors.push(x.message));
   await page.goto(site+'#/programs/pc',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs/pc');
   const pics=page.locator('#page-outlet .r35-photo-thumb img');
   assert.equal(await pics.count(),7,'7 catalogue images in rendered DOM at '+width);
   for(const img of await pics.all()){
    await img.scrollIntoViewIfNeeded();
    assert.ok(await img.evaluate(async e=>{await e.decode().catch(()=>{});return e.complete&&e.naturalWidth>=1100&&e.getAttribute('alt')?.length>10;}),'catalogue real image loaded '+width);
   }
   if(shots){
    const dir=path.join(shots,String(width));fs.mkdirSync(dir,{recursive:true});
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(dir,'r35-pc-catalogue.png'),fullPage:true,animations:'disabled'});
   }
   for(const m of list){
    await page.goto(site+'#'+m.route,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(route=>document.querySelector('#page-outlet')?.dataset.route===route,m.route);
    const img=page.locator('#page-outlet #screens img[src="/assets/r35/'+m.file+'"]');
    assert.equal(await img.count(),1,'one hero shot '+m.route+' at '+width);
    await img.scrollIntoViewIfNeeded();
    const dim=await img.evaluate(async e=>{
      await e.decode().catch(()=>{});
      const r=e.getBoundingClientRect();
      return {complete:e.complete,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,
        left:r.left,right:r.right,width:r.width,screen:innerWidth,scrollWidth:document.documentElement.scrollWidth};
    });
    assert.ok(dim.complete&&dim.naturalWidth===m.width&&dim.naturalHeight===m.height,'decoded source dimensions '+m.route+' '+width);
    assert.ok(dim.width>190&&dim.left>=-1&&dim.right<=width+1,'screenshot fits '+m.route+' '+width);
    assert.ok(dim.scrollWidth<=width+2,'no horizontal page overflow '+m.route+' '+width);
    const href=await page.locator('#page-outlet #screens a.screen-full-link').first().getAttribute('href');
    assert.equal(href,'/assets/r35/'+m.file,'lightbox link is correct '+m.route);
    const nav=page.locator('#page-outlet nav.r19-product-jump a[href="#'+m.route+'#screens"]');
    assert.equal(await nav.count(),1,'screen anchor link '+m.route);
    if(shots){
     const dir=path.join(shots,String(width));
     await page.locator('#page-outlet .r20-product-stage').screenshot({path:path.join(dir,'r35-'+m.id+'-hero.png'),animations:'disabled'});
    }
    visits++;
   }
   assert.deepEqual(errors,[],'no page JS errors at '+width);
   await ctx.close();
   console.log('R35 PASS: 7 actual product captures at '+width+'px, 7 catalogue photos, real image bytes and link navigation.');
  }
  console.log('R35 QA PASS: '+visits+' real screenshot page visits, 14 images in catalogue, 14 product images, 34 routes and 25 detail workflows retained.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
