'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'dist');
const types = { '.woff2': 'font/woff2', '.mp4':'video/mp4', '.vtt':'text/vtt; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
function acceptedEncoding(header, available = ['br','gzip']) {
  const values = new Map();
  for (const entry of String(header || '').toLowerCase().split(',')) {
    const [name, ...parameters] = entry.trim().split(';');
    if (!name) continue;
    const quality = parameters.find(value => value.trim().startsWith('q='));
    const q = quality === undefined ? 1 : Number(quality.trim().slice(2));
    values.set(name, Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0);
  }
  const q = name => values.has(name) ? values.get(name) : (values.get('*') || 0);
  const candidates = available.filter(name => q(name) > 0).sort((a,b) => q(b)-q(a));
  if (values.has('identity') && values.get('identity') > (candidates.length ? q(candidates[0]) : 0)) return 'identity';
  if (candidates.length) return candidates[0];
  return values.get('identity') === 0 || (!values.has('identity') && values.get('*') === 0) ? null : 'identity';
}
function createServer(options={}) {
  // Cache only encoded bytes, never HTTP responses. Rebuilds invalidate by file stat.
  const encoded = new Map();
  function compressedFile(file, encoding, done) {
    fs.stat(file, (error, stat) => {
      if (error) return done(error);
      const key = file + ':' + encoding;
      const signature = [stat.size, stat.mtimeMs, stat.ctimeMs].join(':');
      const cached = encoded.get(key);
      if (cached?.signature === signature) return cached.data.then(data=>done(null,data),done);
      const data = new Promise((resolve,reject) => fs.readFile(file,(readError,bytes)=> {
        if (readError) return reject(readError);
        const zlib = require('node:zlib');
        const settings = encoding === 'br' ? {params:{[zlib.constants.BROTLI_PARAM_QUALITY]:7}} : {};
        (encoding === 'br' ? zlib.brotliCompress : zlib.gzip)(bytes,settings,(zipError,result)=>zipError ? reject(zipError) : resolve(result));
      }));
      encoded.set(key,{signature,data});
      data.then(bytes=>done(null,bytes),error=>{encoded.delete(key);done(error);});
    });
  }
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
    if(options.cmsTestMode && pathname==='/assets/cms-config.js'){
      res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      return res.end(req.method==='HEAD'?'':"window.GF_CMS_CONFIG=Object.freeze({url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:''});");
    }
    if (pathname.includes('\0') || pathname.includes('\\')) { res.writeHead(400); return res.end(); }
    const target = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    const notFound=()=>{res.writeHead(404);res.end('Not found')};
    const send=file=>{
      const compressible = options.compress && /\.(html|css|js|json|svg|txt|xml)$/i.test(file);
      const encoding = acceptedEncoding(req.headers['accept-encoding'],compressible ? ['br','gzip'] : []);
      if (encoding === null) {res.writeHead(406,{'Vary':'Accept-Encoding'});return res.end();}
      if(path.extname(file).toLowerCase()==='.mp4'){
        const size=fs.statSync(file).size,range=req.headers.range;
        const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
        if(range){
          const match=/^bytes=(\d*)-(\d*)$/.exec(range);
          let begin,end;
          if(match&&(match[1]||match[2])){begin=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));end=match[1]?(match[2]?Number(match[2]):size-1):size-1;}
          if(!Number.isSafeInteger(begin)||!Number.isSafeInteger(end)||begin<0||begin>=size||end<begin){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});return res.end()}
          end=Math.min(end,size-1);res.writeHead(206,{...headers,'Content-Length':end-begin+1,'Content-Range':`bytes ${begin}-${end}/${size}`});
          if(req.method==='HEAD')return res.end();return fs.createReadStream(file,{start:begin,end}).on('error',()=>res.destroy()).pipe(res);
        }
        res.writeHead(200,{...headers,'Content-Length':size});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
      }
      const headers = {'Content-Type':types[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(compressible?{'Vary':'Accept-Encoding'}:{})};
      if (encoding === null) {res.writeHead(406,headers);return res.end();}
      if (encoding !== 'identity') headers['Content-Encoding'] = encoding;
      if (req.method === 'HEAD') {res.writeHead(200,headers);return res.end();}
      if (encoding !== 'identity') return compressedFile(file,encoding,(error,bytes)=> {
        if (error) {res.writeHead(500);return res.end();}
        res.writeHead(200,headers);res.end(bytes);
      });
      res.writeHead(200,headers);
      fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
    };
    fs.stat(target, (error, stat) => {
      if (!error && stat.isFile()) return send(target);
      if (!error && stat.isDirectory() && !pathname.endsWith('/')) {
        const location='/'+pathname.split('/').filter(Boolean).map(encodeURIComponent).join('/')+'/'+new URL(req.url,'http://localhost').search;
        res.writeHead(301,{Location:location});return res.end();
      }
      if (!path.extname(target) && !pathname.endsWith('/')) return fs.stat(target+'.html',(e,s)=>!e&&s.isFile()?send(target+'.html'):notFound());
      notFound();
    });
  });
}
module.exports = { createServer, root };
if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  createServer({cmsTestMode:process.argv.includes('--cms-test')}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}`));
}
