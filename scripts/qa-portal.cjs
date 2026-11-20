const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
(async () => {
  const html = fs.readFileSync('public/index.html');
  const routes = [...html.toString('utf8').matchAll(/<template data-route="([^"]+)"/g)].map(m => m[1]);
  assert.equal(routes.length, 35);
  assert.equal(new Set(routes).size, 35);
  const server = http.createServer((req,res) => {
    if (req.url !== '/') {res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = 'http://127.0.0.1:'+server.address().port+'/';
  let browser;
  const failures=[];
  let visited=0;
  const check=(condition,label)=>{if(!condition)failures.push(label);};
  try {
    browser=await chromium.launch({headless:true});
    for(const width of [1440,390,320,768,1920,2560,3840]){
      const context=await browser.newContext({viewport:{width,height:width===3840?2160:width===2560?1440:width===1920?1080:width<761?844:900},reducedMotion:'reduce',isMobile:false,hasTouch:width<761});
      const page=await context.newPage();
      let current='/';
      page.on('pageerror',e=>failures.push(width+' '+current+' JS: '+e.message));
      await page.goto(url);
      const chosen=width===1440||width===390?routes:['/','/programs/pc','/programs/qgis','/projects/file-manager','/projects/drawing-editor'];
      for(const route of chosen){
        current=route;
        await page.evaluate(r=>{location.hash='#'+r},route);
        try{await page.waitForFunction(r=>document.querySelector('#page-outlet')?.dataset.route===r,route,{timeout:7000});}
        catch(e){failures.push(width+' '+route+' render timeout');continue;}
        const metrics=await page.evaluate(()=>({heading:!!document.querySelector('#page-outlet h1'),width:document.documentElement.scrollWidth,inner:innerWidth}));
        visited++;
          check(metrics.heading,width+' '+route+' missing heading');
        check(metrics.width<=metrics.inner+2,width+' '+route+' horizontal overflow '+metrics.width+'/'+metrics.inner);
      }
      current='interaction';
      if(width===1440||width===390){
        await page.evaluate(()=>{location.hash='#/programs/pc'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/programs/pc');
        const search=page.locator('#page-outlet #product-search');
        await search.fill('File Manager');
        check(await page.locator('#page-outlet .catalog-line:not([hidden])').count()===1,width+' search File Manager');
        await search.fill('FileManager');
        check(await page.locator('#page-outlet .catalog-line:not([hidden])').count()===1,width+' compact product search');
        await search.fill('Ｆｉｌｅ　Ｍａｎａｇｅｒ');
        check(await page.locator('#page-outlet .catalog-line:not([hidden])').count()===1,width+' normalized product search');
        await page.locator('#page-outlet .r27-search-clear').click();
        check(await search.evaluate(e=>e.value===''&&document.activeElement===e),width+' reset and focus');
        await search.fill('zz_no_such_product_zz');
        check(await page.locator('#page-outlet .r07-no-results').isVisible(),width+' empty state');
        await search.fill('');
        check(await page.locator('#page-outlet .catalog-line:not([hidden])').count()>1,width+' search reset');
        // Exercise the actual same-hash handler, not just static href checks.
        await page.evaluate(()=>{
          window.__qaAnchorScrolls=0;
          const original=Element.prototype.scrollIntoView;
          Element.prototype.scrollIntoView=function(...args){
            if(this.id==='work')window.__qaAnchorScrolls++;
            return original.apply(this,args);
          };
        });
        const category=page.locator('#page-outlet .r07-category-link[href="#/programs/pc#work"]');
        await category.click();
        await page.waitForFunction(()=>window.__qaAnchorScrolls>=1);
        const before=await page.evaluate(()=>window.__qaAnchorScrolls);
        await category.click();
        await page.waitForFunction(n=>window.__qaAnchorScrolls>n,before);
        check(await page.evaluate(()=>location.hash==='#/programs/pc#work'),width+' same-hash category reselect');
        if(width===390){
          const menu=page.locator('.mobile-menu');
          await menu.locator('summary').click();
          check(await menu.evaluate(e=>e.open),'mobile menu opens');
          await page.locator('#page-outlet h1').click();
          check(!(await menu.evaluate(e=>e.open)),'mobile outside click closes');
          await menu.locator('summary').click();
          await page.keyboard.press('Escape');
          check(!(await menu.evaluate(e=>e.open)),'mobile Escape closes');
        }
        await page.evaluate(()=>{location.hash='#/projects/file-manager'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/file-manager');
        check((await page.locator('#page-outlet .primary-download').getAttribute('href')).includes('/v1.8.2/'),'File Manager asset');
        await page.evaluate(()=>{location.hash='#/projects/drawing-editor'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/drawing-editor');
        check((await page.locator('#page-outlet .primary-download').getAttribute('href')).includes('/v1.1.0/'),'Drawing asset');
      }
      await context.close();
      console.log('Viewport completed: '+width+' / routes '+chosen.length);
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
  console.log(JSON.stringify({visited,failures},null,2));
  assert.equal(visited,95,'Expected viewport/route combinations');
  assert.equal(failures.length,0,'Browser QA failures');
})().catch(e=>{console.error(e);process.exitCode=1});
