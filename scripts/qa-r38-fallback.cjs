'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const publicDir = path.resolve(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
const [, runtimeURL, runtimeHash] = html.match(/<script src="(\/assets\/r38\/portal-main-([a-f0-9]{64})\.js)"><\/script>/);
const asset = url => path.join(publicDir, url);
const digest = data => createHash('sha256').update(data).digest('hex');
const script = fs.readFileSync(asset(runtimeURL), 'utf8');
assert.equal(digest(script), runtimeHash);
assert.ok(Buffer.byteLength(script) < 125_000, 'initial script stays below 125 KB');
assert.ok(html.includes('<link rel="preload" as="script" href="' + runtimeURL + '">'));
assert.ok(/\/assets\/r38\/\*\s+Cache-Control: public, max-age=31536000, immutable/.test(
  fs.readFileSync(path.join(publicDir, '_headers'), 'utf8')));
const frames = JSON.parse(script.match(/^const PRODUCT_FRAME_URLS=(\{[^\n]+\});$/m)[1]);
const sceneRoutes = [...new Set(Array.from(html.matchAll(/\bdata-scene="(\/projects\/[a-z0-9-]+)"/g), match => match[1]))];
assert.deepEqual(Object.keys(frames), sceneRoutes);
for (const url of Object.values(frames)) {
  const contents = fs.readFileSync(asset(url));
  assert.equal(digest(contents), url.match(/([a-f0-9]{64})\.json$/)[1]);
  const sequence = JSON.parse(contents);
  assert.equal(sequence.length, 6);
  for (const encoded of sequence) {
    const image = Buffer.from(encoded, 'base64');
    assert.equal(image.toString('ascii', 0, 4), 'RIFF');
    assert.equal(image.toString('ascii', 8, 12), 'WEBP');
  }
}
console.log('R38 STATIC PASS: hashed runtime, ' + sceneRoutes.length + ' scene-specific WebP sequences.');

const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(publicDir, '.' + (url === '/' ? '/index.html' : url));
  if (!file.startsWith(publicDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const capture = '/projects/capture';
  const cleaner = '/projects/cleaner';
  const frameRequests = page => {
    const urls = [];
    page.on('request', request => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.startsWith('/assets/r38/frames-')) urls.push(pathname);
    });
    return urls;
  };
  const waitForRoute = (page, route) => page.waitForFunction(
    route => document.querySelector('#page-outlet')?.dataset.route === route, route);
  const goto = async (page, route) => {
    await page.goto(origin + '/#' + route, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page, route);
  };
  const scene = page => page.locator('#page-outlet figure[data-scene]');
  const waitForNative = page =>
    page.locator('#page-outlet figure[data-renderer="native-frames"][data-frame-index]').waitFor();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 650 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const requested = frameRequests(page);

      await goto(page, '/');
      await scene(page).scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        document.querySelector('#page-outlet figure[data-scene]')?.dataset.planetTexturesReady === 'true');
      await goto(page, '/programs/pc');
      await goto(page, capture);
      await scene(page).scrollIntoViewIfNeeded();
      await page.locator('#page-outlet figure[data-renderer="webgl2-pbr"][data-frame-ready="true"]').waitFor();
      assert.deepEqual(requested, [], 'home, catalogue and working WebGL do not fetch fallback sequences');

      await scene(page).locator('canvas').evaluate(canvas =>
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
      await waitForNative(page);
      assert.deepEqual(requested, [frames[capture]], 'context loss fetches only this scene once');

      await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type.startsWith('webgl') ? null : getContext.call(this, type, ...args);
        };
      });
      await page.route('**' + frames[cleaner], route => route.fulfill({ status: 503 }));
      await page.goto('about:blank');
      await goto(page, cleaner);
      await scene(page).scrollIntoViewIfNeeded();
      await page.locator('#page-outlet figure[data-renderer="semantic-canvas"][data-render-reason="preview-load-failed"][data-frame-ready="true"]').waitFor();
      assert.deepEqual(requested, [frames[capture], frames[cleaner]], 'failed request keeps the Canvas preview usable');
      await page.unroute('**' + frames[cleaner]);

      await goto(page, '/programs/pc');
      await goto(page, cleaner);
      await scene(page).scrollIntoViewIfNeeded();
      await waitForNative(page);
      assert.deepEqual(requested, [frames[capture], frames[cleaner], frames[cleaner]], 'retry succeeds on return');
      const image = page.locator('#page-outlet #screens img[src^="/assets/r35/"]');
      await image.evaluate(element => element.decode());
      assert.deepEqual(errors, []);
      await page.close();
      console.log('R38 BROWSER PASS: ' + width + 'px home, WebGL, context loss, failed fetch, retry and screenshot.');
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
