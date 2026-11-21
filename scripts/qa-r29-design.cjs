'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..','public');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const links=[['A','#/about'],['B','#/programs/pc'],['D','#/programs/qgis']];
const home=html.split('<template data-route="/">')[1]?.split('</template>')[0];
assert.ok(home,'homepage template');
assert.ok(home.includes('data-design-contract="A+B+D"'),'design contract');
assert.equal((home.match(/class="r29-triad-card /g)||[]).length,3,'exactly three pillars');
for(const [key,url] of links)assert.ok(home.includes('data-design-pillar="'+key+'" href="'+url+'"'),'pillar '+key);
assert.equal((html.match(/<template data-route="/g)||[]).length,34,'34 routes retained');
assert.equal((html.match(/<a class="catalog-line[^"]*" href="#\/projects\//g)||[]).length,25,'25 catalogue items retained');
assert.equal((html.match(/class="r28-workflow"/g)||[]).length,25,'25 detail workflows retained');
assert.equal((html.match(/QGIS 플러그인 <span>10<\/span>/g)||[]).length,0,'stale QGIS count');
assert.equal((html.match(/QGIS 플러그인 <span>9<\/span>/g)||[]).length,2,'cross catalogue QGIS count');
assert.ok(html.includes('id="sunrise-r29-design"'),'R29 CSS loaded');
const shots=process.env.SUNRISE_QA_ARTIFACT_DIR;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const p=u.pathname==='/'?'/index.html':u.pathname;
 const file=path.resolve(root,'.'+p);
 if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [320,390,768,1024,1440,1920,2560]){
   const context=await browser.newContext({viewport:{width,height:880},reducedMotion:'reduce'});
   const page=await context.newPage();
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
   const section=page.locator('#page-outlet .r29-triad'),cards=section.locator('.r29-triad-card');
   assert.equal(await section.count(),1,'one brand bridge at '+width);
   assert.equal(await cards.count(),3,'three gateways at '+width);
   for(let i=0;i<3;i++)assert.equal(await cards.nth(i).getAttribute('href'),links[i][1],'gateway '+links[i][0]+' at '+width);
   const bounds=await page.evaluate(()=>{
    const s=document.querySelector('#page-outlet .r29-triad');
    const box=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}};
    return {outer:box(s),cards:[...s.querySelectorAll('.r29-triad-card')].map(box),scrollWidth:s.scrollWidth,clientWidth:s.clientWidth};
   });
   assert.ok(bounds.outer.left>=-1&&bounds.outer.right<=width+1,'bridge viewport at '+width+': '+JSON.stringify(bounds.outer));
   assert.ok(bounds.scrollWidth<=bounds.clientWidth+2,'bridge horizontal overflow at '+width);
   assert.ok(bounds.cards.every(c=>c.width>160&&c.height>190&&c.left>=-1&&c.right<=width+1),'card fit at '+width+': '+JSON.stringify(bounds.cards));
   if(width===390||width===1440){
     if(shots){const dir=path.join(shots,String(width));fs.mkdirSync(dir,{recursive:true});await section.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,'r29-home-a-b-d.png'),fullPage:true,animations:'disabled'});}
     for(let i=0;i<links.length;i++){
       await cards.nth(i).click();
       await page.waitForFunction(route=>document.querySelector('#page-outlet')?.dataset.route===route,links[i][1].slice(1));
       assert.equal(new URL(page.url()).hash,links[i][1],'link destination '+links[i][0]+' at '+width);
       await page.goto(origin,{waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
     }
     await page.goto(origin+'#/programs/pc',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs/pc');
     assert.equal((await page.locator('.r05-branch-nav a[href="#/programs/qgis"] span').innerText()).trim(),'9','PC cross-tab total at '+width);
     assert.equal(await page.locator('.r29-family-technology').count(),1,'PC tech identity at '+width);
     await page.goto(origin+'#/programs/qgis',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs/qgis');
     assert.equal((await page.locator('.r05-branch-nav a[href="#/programs/qgis"] span').innerText()).trim(),'9','QGIS cross-tab total at '+width);
     assert.equal(await page.locator('.r29-family-geospatial').count(),1,'QGIS identity at '+width);
   }
   await context.close();
   console.log('PASS A+B+D responsive layout '+width+'px');
  }
  console.log('R29 PASS: 7 widths, 6 real gateway clicks, 2 PC/QGIS catalogue counts, 34 routes, 25 workflows.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
