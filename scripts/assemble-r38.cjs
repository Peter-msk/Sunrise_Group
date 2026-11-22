'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const assembleRuntime = require('./assemble-r37.cjs');

assembleRuntime('r38', (source, html) => {
  const embedded = source.match(/^const R13_FRAMES=(\{[^\r\n]+\});$/m);
  if (!embedded) throw new Error('R38 fallback frame table is missing');
  const framesByRoute = JSON.parse(embedded[1]);
  const routes = [...new Set(Array.from(html.matchAll(/\bdata-scene="(\/projects\/[a-z0-9-]+)"/g), match => match[1]))];
  const directory = path.resolve(__dirname, '..', 'public', 'assets', 'r38');
  fs.mkdirSync(directory, { recursive: true });
  const urls = Object.fromEntries(routes.map(route => {
    const frames = framesByRoute[route];
    if (!Array.isArray(frames) || frames.length !== 6 ||
        frames.some(frame => typeof frame !== 'string' || !frame.startsWith('UklG'))) {
      throw new Error('R38 invalid WebP frame sequence for ' + route);
    }
    const data = JSON.stringify(frames);
    const hash = createHash('sha256').update(data).digest('hex');
    const filename = 'frames-' + route.split('/').pop() + '-' + hash + '.json';
    fs.writeFileSync(path.join(directory, filename), data);
    return [route, '/assets/r38/' + filename];
  }));

  let updated = source.replace(embedded[0], 'const PRODUCT_FRAME_URLS=' + JSON.stringify(urls) + ';');
  function replaceOnce(from, to) {
    if (updated.split(from).length !== 2) throw new Error('R38 renderer boundary changed: ' + from);
    updated = updated.replace(from, to);
  }

  replaceOnce(
    'const frames=R13_FRAMES[route]||[],decoded=new Map();let lastImage=null,loadFailure=false;',
    `const decoded=new Map(), frameURL=PRODUCT_FRAME_URLS[route];
 let frames=[], lastImage=null, loadFailure=false, inViewport=false, frameRequest, fallbackReason='';
 function requestFrames(){
   if(!inViewport||!frameURL||frameRequest)return;
   frameRequest=new AbortController();
   fetch(frameURL,{signal:frameRequest.signal})
     .then(response=>{
       if(!response.ok)throw new Error('Preview response '+response.status);
       return response.json();
     })
     .then(data=>{
       if(!Array.isArray(data)||data.length!==6||
          data.some(frame=>typeof frame!=='string'||!frame.startsWith('UklG')))throw new Error('Invalid preview frames');
       if(disposed)return;
       frames=data;
       paint();
     })
     .catch(()=>{
       if(disposed)return;
       fallbackReason='preview-load-failed';
       paint();
     });
 }`
  );
  replaceOnce(
    "mode(frames.length?'native-frames':'semantic-canvas',reason);figure.dataset.frameReady='false';",
    "fallbackReason=reason;mode('semantic-canvas',reason);figure.dataset.frameReady='false';"
  );
  replaceOnce(
    "if(!frames.length||loadFailure){mode('semantic-canvas',loadFailure?'preview-decode-failed':'preview-unavailable');drawScene(canvas,route,phase,false,cameraView);figure.dataset.frameReady='true';return;}",
    "requestFrames();if(!frames.length||loadFailure){mode('semantic-canvas',loadFailure?'preview-decode-failed':fallbackReason);drawScene(canvas,route,phase,false,cameraView);figure.dataset.frameReady='true';return;}"
  );
  replaceOnce(
    "if(!lastImage){let g=canvas.getContext('2d');if(g){g.clearRect(0,0,canvas.width,canvas.height);g.fillStyle=route==='/'?'#0b111a':'#14252b';g.fillRect(0,0,canvas.width,canvas.height);}return;}",
    "if(!lastImage){drawScene(canvas,route,phase,false,cameraView);return;}mode('native-frames',fallbackReason);"
  );
  replaceOnce(
    'visible=es[0].isIntersecting;if(visible)schedule();else stop()',
    'visible=inViewport=es[0].isIntersecting;if(visible){if(!gpu)paint();schedule();}else stop()'
  );
  replaceOnce(
    'disposed=true;stop();io.disconnect();ro.disconnect();button.removeEventListener',
    'disposed=true;frameRequest?.abort();stop();io.disconnect();ro.disconnect();button.removeEventListener'
  );

  const rawBefore = Buffer.byteLength(source);
  const rawAfter = Buffer.byteLength(updated);
  console.log('R38: ' + Buffer.byteLength(embedded[0]) + ' bytes of inline frame data; ' +
    routes.length + ' product sequences emitted (' + (Object.keys(framesByRoute).length - routes.length) +
    ' sequences without an active product scene omitted).');
  console.log('R38 main script raw: ' + rawBefore + ' → ' + rawAfter + ' bytes; gzip estimate: ' +
    gzipSync(source).length + ' → ' + gzipSync(updated).length + ' bytes.');
  return updated;
});
