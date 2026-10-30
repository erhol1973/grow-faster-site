const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../dist');
function createCacheServer(){
  let version=1;const requests=[];
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');let file=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
    const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
    if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return}
    const html=file.endsWith('.html'),etag='"'+(html?version:'asset')+'-'+file+'"';requests.push({file,version,conditional:req.headers['if-none-match']||null});
    if(req.headers['if-none-match']===etag){res.writeHead(304,{'ETag':etag,'Cache-Control':'max-age=0, must-revalidate'});res.end();return}
    let body=fs.readFileSync(target);if(html){let text=body.toString().replace('<html','<html data-fixture-release="'+version+'"');if(version===1)text=text.replace(/<script\b[^>]*\bsrc=["']assets\/(?:models|consent)\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,'').replaceAll('href="about.html">Contact</a>','href="about.html#contact">Contact</a>');body=Buffer.from(text)}
    const type=html?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'ETag':etag,'Cache-Control':html?'max-age=0, must-revalidate':'public, max-age=3600'});res.end(body);
  });return {server,requests,publish(){version=2}};
}
module.exports={createCacheServer};
