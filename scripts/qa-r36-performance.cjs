'use strict';
// Focused R36 gate. Earlier R35 full screenshot/browser QA is not rerun here.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const {chromium}=require('playwright');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
const headers=fs.readFileSync(path.join(pub,'_headers'),'utf8');
assert.equal((html.match(/requestAnimationFrame\(preloadPlanetTextures\)/g)||[]).length,0,
 'solar textures must not start unconditionally');
assert.ok(html.includes('if(visible){preloadPlanetTextures();requestPaint();schedule();}'),
 'solar preload remains connected to IntersectionObserver');
assert.ok(/\/assets\/r35\/\*\s*\n\s*Cache-Control: public, max-age=3600, stale-while-revalidate=86400/.test(headers),
 'R35 real screenshot caching must be bounded (not immutable)');
assert.equal((html.match(/<template data-route="/g)||[]).length,34);
assert.equal((html.match(/class="r28-workflow" id="workflow"/g)||[]).length,25);
assert.ok(headers.includes('X-Content-Type-Options: nosniff'),'disable MIME sniffing on static assets');
assert.equal(cp.execFileSync('git',['check-ignore','--no-index','public/assets/r35/generated.webp'],
 {cwd:root,encoding:'utf8'}).trim(),'public/assets/r35/generated.webp',
 'generated R35 assets must be ignored by Git');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'source','r35','screenshots.json'),'utf8')).screenshots;
assert.equal(manifest.length,7);
const start=html.indexOf('const R15_PLANET_DATA='),begin=html.indexOf('{',start),end=html.indexOf('},R15_PLANET_IMAGES=',begin);
assert.ok(start>0&&end>begin,'original 9-planet manifest available');
const planetUrls=new Set(Object.values(JSON.parse(html.slice(begin,end+1))));
assert.equal(planetUrls.size,9,'nine original solar textures preserved');
console.log('R36 STATIC PASS: solar on-visibility trigger, bounded R35 browser caching, 34 routes, 25 workflows, 9 textures intact.');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,rel=pathname==='/'?'/index.html':pathname;
 const dst=path.resolve(pub,'.'+rel);
 if(!dst.startsWith(pub+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(dst)||!fs.statSync(dst).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.js':'application/javascript','.css':'text/css'};
 res.writeHead(200,{'Content-Type':mime[path.extname(dst)]||'application/octet-stream'});fs.createReadStream(dst).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 let browser;try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:600},reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[],planetRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(planetUrls.has(new URL(r.url()).pathname))planetRequests.push(r.url());});
  await page.goto(base+'#/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
  const scene=page.locator('#page-outlet .r23-stage');
  assert.equal(await scene.count(),1,'solar stage on homepage '+width);
  const bounds=await scene.boundingBox();assert.ok(bounds,'solar scene has physical bounds '+width);
  if(bounds.y>=600||bounds.y+bounds.height<=0){
   // If the solar scene is below the first viewport, no nine-texture burst on load.
   await page.waitForTimeout(160);
   assert.equal(planetRequests.length,0,'off-screen mobile solar does not fetch textures '+width);
  }
  await scene.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#page-outlet .r23-stage')?.closest('figure')?.dataset.r15PlanetPreloadRequested==='true');
  assert.ok(planetRequests.length>0,'visible solar starts texture requests '+width);
  await page.goto(base+'#/projects/cleaner',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/cleaner');
  const img=page.locator('#page-outlet #screens img[src^="/assets/r35/"]');
  assert.equal(await img.count(),1,'R35 real product image retained '+width);
  await img.evaluate(e=>e.decode());
  assert.ok(await img.evaluate(e=>e.naturalWidth>=1100),'real image decodes '+width);
  assert.deepEqual(errors,[],'no browser JS errors '+width);
  await ctx.close();
  console.log('R36 BROWSER PASS: '+width+'px homepage solar visibility and representative R35 product.');
 }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
