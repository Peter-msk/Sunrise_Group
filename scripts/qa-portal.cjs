const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
// R28: route, interaction, product-copy and static-image delivery contract.
const productContract={
  "/programs/pc":[
    ["capture","Sunrise Capture","v4.2.2","정식 배포","배포 버전","v4.2.2"],
    ["file-manager","Sunrise File Manager","v1.8.2","정식 배포","배포 버전","v1.8.2"],
    ["cleaner","Sunrise Cleaner","v3.7.7","정식 배포","배포 버전","v3.7.7"],
    ["pdf-editor","Sunrise PDF Editor","v4.6.3","정식 배포","배포 버전","v4.6.3"],
    ["pdf-pro","Sunrise PDF PRO","v2.7.1","정식 배포","배포 버전","v2.7.1"],
    ["image","Sunrise Image","버전 번호 미표기","정식 배포","배포 버전","버전 번호 미표기"],
    ["drawing-editor","Sunrise Drawing Editor","v1.1.0","정식 배포","배포 버전","v1.1.0"],
    ["eiass","Sunrise EIASS","v4.7.0","정식 배포","배포 버전","v4.7.0"],
    ["finder","Sunrise Finder","v2.1.2","개발 중지","개발 및 운영 상태","개발 중지"],
    ["eia-manager","EIA Manager","개발 중","개발 중","개발 및 운영 상태","개발 중"],
    ["pdf-editor-web","Sunrise PDF Editor Web","웹 서비스 운영 중","정식 배포","개발 및 운영 상태","웹 서비스 운영 중"],
    ["pdf-pro-web","Sunrise PDF PRO Web","웹 서비스 운영 중","정식 배포","개발 및 운영 상태","웹 서비스 운영 중"],
    ["eia-hub","Sunrise EIA Data Hub","개발 중","개발 중","개발 및 운영 상태","개발 중"],
    ["eiass-mobile","Sunrise EIASS Mobile","상태 확인 중","상태 확인 중","개발 및 운영 상태","상태 확인 중"],
    ["gis","Sunrise GIS","상태 확인 중","상태 확인 중","개발 및 운영 상태","상태 확인 중"],
    ["aermod","Sunrise Aermod","개발 중지","개발 중지","개발 및 운영 상태","개발 중지"]
  ],
  "/programs/qgis":[
    ["qgis-tool","Sunrise QGIS Tool Plugin","0.7.4","개발 완료"],
    ["protection-analyzer","환경 보호·보전지구 통합분석","1.0.24","개발 완료"],
    ["survey-designer","환경영향평가 조사지점 자동설계","1.5.2","개발 완료"],
    ["survey-locator","조사지점 찾기","1.0.0","개발 중"],
    ["elevation-slope","표고·경사 통합분석","2.6.2 RC1","개발 완료"],
    ["3d-map","Sunrise 3D Map","0.24.0 R23","개발 중"],
    ["map-designer","Sunrise Map Designer","1.6.4 DEV94-RC1","개발 완료"],
    ["onmap-spatializer","Sunrise OnMap Spatializer","2.0.0","개발 완료"],
    ["color-distributor","QGIS 컬러 분배기","0.1.5 P5.1","개발 중"]
  ]
};
(async () => {
  const html = fs.readFileSync('public/index.html');
  const htmlText=html.toString('utf8');
  const publicDir=path.resolve('public');
  const assetDir=path.join(publicDir,'assets','r28');
  const assets=fs.readdirSync(assetDir).filter(file=>/\.(?:png|jpg|webp|gif)$/i.test(file));
  assert.equal(assets.length,23,'R28 content-addressed image asset count');
  assert.ok(assets.every(file=>fs.statSync(path.join(assetDir,file)).size>0),'R28 image assets are non-empty');
  assert.equal((htmlText.match(/data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]{128,}/gi)||[]).length,0,'no inline base64 image payloads');
  assert.equal(htmlText.includes('사진 분류 도우미'),false,'non-owned product name removed');
  assert.equal(htmlText.includes('photo-classifier'),false,'non-owned route removed');
  const imageTags=[...htmlText.matchAll(/<img\b[^>]*>/gi)].map(match=>match[0]);
  assert.equal(imageTags.length,17,'R28 optimized image tag count');
  assert.equal((htmlText.match(/<img\b[^>]*loading="eager"[^>]*fetchpriority="high"/gi)||[]).length,12,'route-leading image priority count');
  assert.equal((htmlText.match(/<img\b[^>]*loading="lazy"/gi)||[]).length,5,'deferred image count');
  for(const tag of imageTags){
    assert.match(tag,/src="\/assets\/r28\//,'image uses static asset URL');
    assert.match(tag,/loading="(?:eager|lazy)"/,'image loading mode');
    assert.match(tag,/decoding="async"/,'image async decoding');
    assert.match(tag,/width="\d+"/,'image intrinsic width');
    assert.match(tag,/height="\d+"/,'image intrinsic height');
    assert.match(tag,/class="[^"]*r28-optimized-image/,'R28 image marker');
  }
  const qgisTemplate=(htmlText.match(/<template data-route="\/programs\/qgis">([\s\S]*?)<\/template>/)||[])[1];
  assert.ok(qgisTemplate,'QGIS catalogue route exists');
  assert.equal((qgisTemplate.match(/<a class="catalog-line[^"]*" href="#\/projects\//g)||[]).length,9,'nine owned QGIS plugins');
  const pluginManagementGroup=(qgisTemplate.match(/<section class="catalog-group r19-atlas-group r28-no-group-art"[^>]*>[\s\S]*?<\/section>/)||[])[0];
  assert.ok(pluginManagementGroup,'owned QGIS plugin-management group exists');
  assert.equal(pluginManagementGroup.includes('r19-group-art'),false,'non-owned field-photo group artwork removed');
  assert.match(qgisTemplate,/개발 완료 6개/);
  assert.match(qgisTemplate,/개발 중 3개/);
  const eiassTemplate=(htmlText.split('<template data-route="/projects/eiass">')[1]||'').split('</template>')[0];
  assert.ok(eiassTemplate,'Sunrise EIASS detail route exists');
  assert.match(eiassTemplate,/EIASS 운영기관의 공식 소프트웨어가 아닌/,'Sunrise EIASS independent-product disclaimer');
  const drawingTemplate=(htmlText.split('<template data-route="/projects/drawing-editor">')[1]||'').split('</template>')[0];
  assert.ok(drawingTemplate,'Drawing Editor detail route exists');
  assert.match(drawingTemplate,/DWG/,'Drawing Editor DWG input is documented');
  assert.match(drawingTemplate,/ODA File Converter/,'Drawing Editor external DWG dependency is disclosed');
  assert.match(drawingTemplate,/DWG 지원 LibreCAD/,'Drawing Editor alternate DWG dependency is disclosed');
  assert.equal((htmlText.match(/class="r28-workflow"/g)||[]).length,25,'all product details have workflow sections');
  const routes = [...htmlText.matchAll(/<template data-route="([^"]+)"/g)].map(m => m[1]);
  assert.equal(routes.length,34);
  assert.equal(new Set(routes).size,34);
  const server = http.createServer((req,res) => {
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(pathname==='/'||pathname==='/index.html'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate'});
      res.end(html);return;
    }
    if(pathname.startsWith('/assets/r28/')){
      const target=path.resolve(publicDir,'.'+pathname);
      const relative=path.relative(assetDir,target);
      if(relative.startsWith('..')||path.isAbsolute(relative)||!fs.existsSync(target)){res.writeHead(404);res.end();return;}
      const types={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
      res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable'});
      fs.createReadStream(target).pipe(res);return;
    }
    res.writeHead(404);res.end();
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = 'http://127.0.0.1:'+server.address().port+'/';
  let browser;
  const failures=[];
  let visited=0;
  let navigationAttempted=0,navigationPassed=0;
  let productAttempted=0,productPassed=0;
  const check=(condition,label)=>{if(!condition)failures.push(label);};
  try {
    browser=await chromium.launch({headless:true});
    const planetMapStart=htmlText.indexOf('const R15_PLANET_DATA=');
    assert.ok(planetMapStart>=0,'R15 solar texture manifest exists');
    const planetObjectStart=htmlText.indexOf('{',planetMapStart);
    const planetObjectEnd=htmlText.indexOf('},R15_PLANET_IMAGES=',planetObjectStart);
    assert.ok(planetObjectStart>=0&&planetObjectEnd>planetObjectStart,'R15 solar texture object boundary exists');
    const planetUrls=Object.values(JSON.parse(htmlText.slice(planetObjectStart,planetObjectEnd+1)));
    assert.equal(planetUrls.length,9,'nine solar texture assets');
    assert.ok(planetUrls.every(path=>path.startsWith('/assets/r28/')),'solar textures use content-addressed static assets');
    const perfContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const perfPage=await perfContext.newPage();
    const planetResponses=new Map();
    perfPage.on('response',response=>{
      const pathname=new URL(response.url()).pathname;
      if(planetUrls.includes(pathname))planetResponses.set(pathname,response.status());
    });
    await perfPage.goto(url+'#/projects/file-manager');
    await perfPage.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/file-manager');
    await perfPage.waitForTimeout(250);
    assert.equal(planetResponses.size,0,'unrelated product page does not fetch solar textures');
    await perfPage.evaluate(()=>{location.hash='#/'});
    await perfPage.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/');
    const solarFigure=perfPage.locator('#page-outlet figure[data-scene="/"]');
    assert.equal(await solarFigure.count(),1,'home solar scene exists');
    await solarFigure.scrollIntoViewIfNeeded();
    await perfPage.waitForFunction(()=>document.querySelector('#page-outlet figure[data-scene="/"]')?.dataset.r15PlanetPreloadRequested==='true',null,{timeout:7000});
    await perfPage.waitForFunction(urls=>urls.every(path=>performance.getEntriesByType('resource').some(entry=>new URL(entry.name).pathname===path)),planetUrls,{timeout:15000});
    assert.equal(planetResponses.size,planetUrls.length,'all solar textures fetched only after home scene becomes visible');
    assert.ok([...planetResponses.values()].every(status=>status===200),'all deferred solar textures return HTTP 200');
    console.log('Performance: 9 solar textures deferred on unrelated pages; 9/9 loaded when home scene became visible.');
    await perfContext.close();
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
        check(await page.locator('#page-outlet a[href^="http"], #page-outlet .primary-download, #page-outlet a[download]').count()===0,width+' '+route+' intro-only policy');
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
          // Click an exposed, non-interactive point outside the open overlay.
          // The page heading can legitimately be covered by the navigation.
          const routeBeforeOutsideClick=await page.evaluate(()=>location.hash);
          const outside=await page.evaluate(()=>{
            const menu=document.querySelector('.mobile-menu[open]');
            if(!menu)return null;
            const interactive='a,button,input,select,textarea,summary,label,[role="button"],[role="link"],[contenteditable]';
            const candidates=[];
            for(let y=4;y<innerHeight;y+=8){
              for(let x=4;x<innerWidth;x+=8){
                const target=document.elementFromPoint(x,y);
                if(!target||menu.contains(target)||target.closest(interactive))continue;
                const inPage=!!target.closest('#page-outlet');
                candidates.push({x,y,inPage});
              }
            }
            return candidates.find(p=>p.inPage)||candidates[0]||null;
          });
          check(!!outside,'mobile menu leaves an exposed non-interactive outside-click target');
          if(outside){
            await page.mouse.click(outside.x,outside.y);
            check(!(await menu.evaluate(e=>e.open)),'mobile outside click closes');
            check(await page.evaluate(()=>location.hash)===routeBeforeOutsideClick,'mobile outside click preserves route');
          }
          // Keep the Escape check independent if the outside-click assertion fails.
          if(await menu.evaluate(e=>e.open))await menu.locator('summary').click();
          await menu.locator('summary').click();
          await page.keyboard.press('Escape');
          check(!(await menu.evaluate(e=>e.open)),'mobile Escape closes');
        }
        await page.evaluate(()=>{location.hash='#/projects/file-manager'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/file-manager');
        check(await page.locator('#page-outlet #specifications').innerText().then(t=>t.includes('v1.8.2')),'File Manager version');
        await page.evaluate(()=>{location.hash='#/projects/drawing-editor'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/drawing-editor');
        check(await page.locator('#page-outlet #specifications').innerText().then(t=>t.includes('v1.1.0')),'Drawing Editor version');
        await page.evaluate(()=>{location.hash='#/projects/capture'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/capture');
        const preview=page.locator('#page-outlet a[data-image="true"]').first();
        const popupEvent=page.waitForEvent('popup');
        await preview.click();
        const popup=await popupEvent;
        try{
          await popup.waitForFunction(()=>location.pathname.startsWith('/assets/r28/')&&document.querySelector('img')?.naturalWidth>0);
          check(await popup.evaluate(()=>window.opener===null),width+' screenshot preview opener isolation');
        }finally{await popup.close();}
        await page.evaluate(()=>{location.hash='#/projects/eia-hub'});
        await page.waitForFunction(()=>document.querySelector('#page-outlet')?.dataset.route==='/projects/eia-hub');
        check(await page.locator('#page-outlet #specifications > div').count()===2,width+' deduplicated EIA Hub facts');
      }
      if(width===1440||width===390){
        current='navigation';
        const waitDestination=async href=>{
          const [route,anchor]=href.slice(1).split('#');
          await page.waitForFunction(({href,route})=>location.hash===href&&document.querySelector('#page-outlet')?.dataset.route===route,{href,route},{timeout:7000});
          assert.ok(await page.locator('#page-outlet h1').isVisible(),'destination heading: '+href);
          if(anchor)await page.waitForFunction(id=>{
            const outlet=document.querySelector('#page-outlet'),target=document.getElementById(id);
            if(!target||!outlet.contains(target)||!target.getClientRects().length)return false;
            const rect=target.getBoundingClientRect(),header=document.querySelector('.site-header')?.getBoundingClientRect();
            return rect.top<innerHeight&&rect.bottom>Math.max(0,header?.bottom||0)&&(target.tagName!=='DETAILS'||target.open);
          },anchor,{timeout:7000});
        };
        const navigationCase=async(label,run)=>{
          navigationAttempted++;
          const start=failures.length;
          try{
            await page.keyboard.press('Escape');
            await run();
            if(failures.length===start)navigationPassed++;
            console.log('Navigation '+width+' '+label+': '+(failures.length===start?'PASS':'FAIL'));
          }catch(error){failures.push(width+' '+label+': '+String(error.message).slice(0,650));console.log('Navigation '+width+' '+label+': FAIL');}
        };
        if(width===1440){
          for(const href of ['#/about','#/programs','#/development','#/help']){
            await navigationCase('desktop primary '+href,async()=>{
              await page.locator('.desktop-nav .nav-card[href="'+href+'"]').click({timeout:7000});
              await waitDestination(href);
            });
          }
          for(const [id,links] of [['group-submenu',['#/about','#/philosophy','#/future']],['program-submenu',['#/programs/pc','#/programs/qgis']],['development-submenu',['#/development#pc-status','#/development#qgis-status']]]){
            for(const href of links)await navigationCase('desktop submenu '+href,async()=>{
              const toggle=page.locator('.desktop-nav button[aria-controls="'+id+'"]');
              const submenu=page.locator('#'+id);
              await toggle.click({timeout:7000});
              assert.equal(await toggle.getAttribute('aria-expanded'),'true');
              await submenu.locator('a[href="'+href+'"]').click({timeout:7000});
              await waitDestination(href);
              assert.equal(await toggle.getAttribute('aria-expanded'),'false');
              assert.ok(!(await submenu.isVisible()),'submenu closes after selection');
            });
          }
        }else{
          const menu=page.locator('.mobile-menu');
          for(const href of ['#/about','#/philosophy','#/future','#/programs','#/programs/pc','#/programs/qgis','#/development','#/development#pc-status','#/development#qgis-status','#/help']){
            await navigationCase('mobile menu '+href,async()=>{
              await menu.locator('summary').click({timeout:7000});
              assert.ok(await menu.evaluate(e=>e.open));
              await menu.locator('nav a[href="'+href+'"]').click({timeout:7000});
              await waitDestination(href);
              assert.ok(!(await menu.evaluate(e=>e.open)),'mobile menu closes after selection');
            });
          }
        }
        for(const route of ['/programs/pc','/programs/qgis']){
          await navigationCase('catalogue click and history '+route,async()=>{
            await page.evaluate(r=>{location.hash='#'+r},route);
            await waitDestination('#'+route);
            const link=page.locator('#page-outlet .catalog-line[href^="#/projects/"]:visible').first();
            const href=await link.getAttribute('href',{timeout:7000});
            assert.ok(href&&routes.includes(href.slice(1)),'catalogue link targets a known product');
            await link.click({timeout:7000});
            await waitDestination(href);
            await page.goBack({timeout:7000});
            await waitDestination('#'+route);
            await page.goForward({timeout:7000});
            await waitDestination(href);
          });
        }
      }
      if(width===1440||width===390){
        current='product-contract';
        const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
        const productCase=async(label,run)=>{
          productAttempted++;
          const start=failures.length;
          try{
            await run();
            if(failures.length===start)productPassed++;
            console.log('Product '+width+' '+label+': '+(failures.length===start?'PASS':'FAIL'));
          }catch(error){
            failures.push(width+' product '+label+': '+String(error.message).slice(0,650));
            console.log('Product '+width+' '+label+': FAIL');
          }
        };
        const gotoRoute=async route=>{
          await page.evaluate(r=>{location.hash='#'+r},route);
          await page.waitForFunction(r=>location.hash==='#'+r&&document.querySelector('#page-outlet')?.dataset.route===r,route,{timeout:7000});
        };
        const input=page.locator('#page-outlet #product-search');
        const activeRows=page.locator('#page-outlet .catalog-line:not([hidden])');
        const visibleIds=()=>activeRows.evaluateAll(rows=>rows.map(r=>r.getAttribute('href')).sort());
        const href=id=>'#/projects/'+id;
        const checkCount=async(n,total)=>{
          assert.equal(clean(await page.locator('#page-outlet .r07-result').innerText()),n+'개 / 전체 '+total+'개');
          assert.equal(await page.locator('#page-outlet .r07-no-results').isVisible(),n===0);
        };
        for(const [route,items] of Object.entries(productContract)){
          const qgis=route==='/programs/qgis';
          const expected=items.map(r=>href(r[0])).sort();
          await productCase('catalogue inventory '+route,async()=>{
            await gotoRoute(route);
            await input.fill('');
            assert.deepEqual(await visibleIds(),expected);
            await checkCount(items.length,items.length);
            await input.fill('zz_sunrise_missing_product_zz');
            assert.deepEqual(await visibleIds(),[]);
            await checkCount(0,items.length);
            await page.locator('#page-outlet .r27-search-clear').click({timeout:7000});
            assert.deepEqual(await visibleIds(),expected);
            assert.ok(await input.evaluate(e=>e.value===''&&document.activeElement===e));
            await checkCount(items.length,items.length);
          });
          for(const state of ['개발 중','개발 완료','개발 중지','정식 배포','상태 확인 중','웹 서비스 운영 중']){
            await productCase('status '+route+' '+state,async()=>{
              await gotoRoute(route);
              await input.fill(state);
              const ids=items.filter(r=>r[3]===state||(state==='웹 서비스 운영 중'&&r[2]===state)).map(r=>href(r[0])).sort();
              assert.deepEqual(await visibleIds(),ids);
              await checkCount(ids.length,items.length);
              const groupsCorrect=await page.locator('#page-outlet .catalog-group').evaluateAll(groups=>groups.every(g=>g.hidden===!g.querySelector('.catalog-line:not([hidden])')));
              assert.ok(groupsCorrect,'empty category visibility');
            });
          }
          for(const [id,name,version,status,field,expectedValue] of items){
            await productCase(route+' '+id,async()=>{
              await gotoRoute(route);
              const row=page.locator('#page-outlet .catalog-line[href="'+href(id)+'"]');
              assert.equal(await row.count(),1,'unique catalogue item');
              for(const query of new Set([name,name.replace(/\s+/g,'')])){
                await input.fill(query);
                assert.ok(await row.isVisible(),'search finds '+name+' / '+query);
              }
              assert.equal(clean(await row.locator('h3').innerText()),name);
              assert.equal(clean(await row.locator('.catalog-line-meta b').innerText()),version);
              assert.ok(clean(await row.locator('.catalog-line-meta').innerText()).includes(status),'catalogue status');
              await row.click({timeout:7000});
              await page.waitForFunction(id=>location.hash==='#/projects/'+id&&document.querySelector('#page-outlet')?.dataset.route==='/projects/'+id,id,{timeout:7000});
              assert.equal(clean(await page.locator('#page-outlet h1').innerText()),name);
              assert.equal(await page.locator('#page-outlet .r28-workflow').count(),1,'detailed workflow section');
              const facts=await page.locator('#page-outlet #specifications > div').evaluateAll(nodes=>nodes.map(e=>[e.querySelector('span')?.textContent?.trim(),e.querySelector('strong')?.textContent?.trim()]));
              assert.ok(facts.length>=2&&facts.every(([k,v])=>k&&v),'nonempty product facts');
              assert.equal(new Set(facts.map(f=>f[0])).size,facts.length,'unique fact labels');
              const values=Object.fromEntries(facts);
              if(qgis){
                assert.equal(values['이용 형태'],'QGIS 플러그인');
                assert.equal(values['확인한 개발 기준본'],version);
                assert.equal(values['개발 상태'],status);
                const statusBox=clean(await page.locator('#page-outlet .status-box').innerText());
                assert.ok(statusBox.includes('공개 링크 미확인')&&statusBox.includes('NOT RUN'),'QGIS runtime evidence limits');
                assert.equal(await page.locator('#page-outlet .r28-runtime-note').count(),1,'QGIS Runtime NOT RUN notice is visible');
              }else{
                assert.equal(values[field],expectedValue,'detail fact '+field);
                if(['finder','eiass','eia-manager','eia-hub','drawing-editor'].includes(id))assert.equal(await page.locator('#page-outlet .r28-product-note').count(),1,'product-specific status or dependency notice is visible');
                if(id==='finder'){
                  assert.equal(values['공개 상태'],'v2.1.2 공개 Release');
                  assert.ok(clean(await page.locator('#page-outlet .status-box').innerText()).includes('v2.1.2 공개 Release'),'Finder last public release is visible');
                }
                if(id==='aermod')assert.equal(values['공개 상태'],'공개 미정');
                if(id==='eia-hub'||id==='eia-manager')assert.equal(facts.length,2,'deduplicated development facts');
                if(id.endsWith('-web'))assert.equal(values['이용 환경'],'웹 브라우저');
              }
              assert.equal(await page.locator('#page-outlet a[href^="http"],#page-outlet .primary-download,#page-outlet a[download]').count(),0,'introduction-only policy');
            });
          }
        }
      }
      await context.close();
      console.log('Viewport completed: '+width+' / routes '+chosen.length);
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
  console.log(JSON.stringify({visited,navigationAttempted,navigationPassed,productAttempted,productPassed,failures},null,2));
  assert.equal(visited,93,'Expected viewport/route combinations');
  assert.equal(navigationAttempted,25,'Expected navigation cases');
  assert.equal(navigationPassed,25,'Navigation QA failures');
  assert.equal(productAttempted,78,'Expected product catalogue cases');
  assert.equal(productPassed,78,'Product catalogue QA failures');
  assert.equal(failures.length,0,'Browser QA failures');
})().catch(e=>{console.error(e);process.exitCode=1});
