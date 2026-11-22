'use strict';
// R37 targeted check: no full R35 screenshot matrix rerun after unchanged source/DOM.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const http=require('node:http');
const cp=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
const headers=fs.readFileSync(path.join(pub,'_headers'),'utf8');
const matches=[...html.matchAll(/<script src="(\/assets\/r37\/portal-main-([a-f0-9]{64})\.js)"><\/script>/g)];
assert.equal(matches.length,1,'one external main runtime');
const [tag,assetURL,digest]=matches[0];
const source=fs.readFileSync(path.join(pub,assetURL.slice(1)));
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),digest,'runtime hash matches filename');
const main=source.toString('utf8');
assert.ok(main.includes('function sg3Render(figure)'),'main renderer retained');
assert.ok(main.includes('function render(reselect=false)'),'original synchronous SPA router retained');
assert.ok(!html.includes('function sg3Render(figure)'),'large main script absent from HTML');
assert.ok(html.includes('<link rel="preload" as="script" href="'+assetURL+'">'),'preload main script');
assert.ok(!tag.includes(' async')&&!tag.includes(' defer')&&!tag.includes('type="module"'),'classic blocking script remains');
assert.ok(main.includes('if(visible){preloadPlanetTextures();requestPaint();schedule();}'),'R36 lazy solar trigger retained');
assert.ok(!main.includes('requestAnimationFrame(preloadPlanetTextures)'),'R36 unconditional preload remains removed');
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'34 routes');
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25,'25 workflows');
assert.equal((html.match(/class="sg3-product-object r04-thumb r35-photo-thumb"/g)||[]).length,7,'7 unchanged real product thumbnails');
assert.ok(/\/assets\/r37\/\*\s*\n\s*Cache-Control: public, max-age=31536000, immutable/.test(headers),'immutable hashed JS caching');
assert.equal(cp.execFileSync('git',['check-ignore','--no-index','public/assets/r37/example.js'],
 {cwd:root,encoding:'utf8'}).trim(),'public/assets/r37/example.js','generated script not tracked by Git');
const start=main.indexOf('const R15_PLANET_DATA='),begin=main.indexOf('{',start),end=main.indexOf('},R15_PLANET_IMAGES=',begin);
assert.ok(start>0&&end>begin,'original solar data remains');
const planetURLs=new Set(Object.values(JSON.parse(main.slice(begin,end+1))));
assert.equal(planetURLs.size,9,'nine planet assets');
assert.ok(Buffer.byteLength(html,'utf8')<3_300_000,'R37 HTML is smaller than 3.3 MB');
console.log('R37 STATIC PASS: hash-preloaded blocking runtime, 34 routes, 25 workflows, 7 photos, 9 textures, immutable cache.');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,relative=pathname==='/'?'/index.html':pathname;
 const dst=path.resolve(pub,'.'+relative);
 if(!dst.startsWith(pub+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dst)||!fs.statSync(dst).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.css':'text/css; charset=utf-8'};
 res.writeHead(200,{'Content-Type':mime[path.extname(dst)]||'application/octet-stream'});
 fs.createReadStream(dst).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:600},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],planetRequests=[],runtimeRequests=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('request',req=>{
    const pathname=new URL(req.url()).pathname;
    if(planetURLs.has(pathname))planetRequests.push(pathname);
    if(pathname===assetURL)runtimeRequests.push(req.url());
   });
   await page.goto(base+'#/programs/pc',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs/pc');
   await page.waitForTimeout(150);
   assert.equal(planetRequests.length,0,'non-home route does not request solar textures '+width);
   assert.equal(runtimeRequests.length,1,'preload and classic script share one network request '+width);
   await page.goto(base+'#/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
   const scene=page.locator('#page-outlet .r23-stage');
   assert.equal(await scene.count(),1,'home scene exists '+width);
   await scene.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('#page-outlet .r23-stage')?.closest('figure')?.dataset.planetTexturesReady==='true');
   assert.equal(new Set(planetRequests).size,9,'nine solar textures load when visible '+width);
   await page.goto(base+'#/projects/cleaner',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/cleaner');
   const image=page.locator('#page-outlet #screens img[src^="/assets/r35/"]');
   assert.equal(await image.count(),1,'real Cleaner screenshot '+width);
   await image.evaluate(e=>e.decode());
   assert.ok(await image.evaluate(e=>e.naturalWidth>=1100),'photo decoded '+width);
   assert.deepEqual(errors,[],'no browser pageerror '+width);
   await context.close();
   console.log('R37 BROWSER PASS: '+width+'px script load once, navigation, solar, screenshot.');
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
