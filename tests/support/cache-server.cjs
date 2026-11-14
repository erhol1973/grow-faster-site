const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../dist');
const legacyNavigation=fs.readFileSync(path.join(__dirname,'legacy-navigation.html'),'utf8');
function oldMarkup(text){return text.replace(/<script\b[^>]*\bsrc=["']assets\/(?:models|consent)\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,'').replace('class="nav nav-executive"','class="nav"').replace(/<ul id="navlist">[\s\S]*?<\/ul>(\s*<div class="lang lang-top")/,legacyNavigation+'$1').replaceAll('href="about.html">Contact</a>','href="about.html#contact">Contact</a>')}
function oldTypographyMarkup(text){return text.replace(/<link\b[^>]*\bhref=["'][^"']*assets\/typography\.css[^"']*["'][^>]*>\s*/gi,'').replace(/<script\b[^>]*\bsrc=["'][^"']*assets\/typography\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,'').replace(/assets\/site\.(js|css)(?:\?[^"']*)?/g,(_,extension)=>'assets/site.'+extension+'?v=legacy-typography-fixture')}
function createCacheServer({typographyTransition=false}={}){
  let version=1;const requests=[];
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');let file=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
    const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
    if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return}
    const html=file.endsWith('.html'),etag='"'+(html?version:'asset')+'-'+file+'"';requests.push({file,url:url.pathname+url.search,version,conditional:req.headers['if-none-match']||null});
    if(req.headers['if-none-match']===etag){res.writeHead(304,{'ETag':etag,'Cache-Control':'max-age=0, must-revalidate'});res.end();return}
    let body=fs.readFileSync(target);if(file==='assets/cms-config.js')body=Buffer.from("window.GF_CMS_CONFIG=Object.freeze({url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:''});");if(html){let text=body.toString().replace('<html','<html data-fixture-release="'+version+'"');if(version===1)text=typographyTransition?oldTypographyMarkup(text):oldMarkup(text);body=Buffer.from(text)}
    // Synthetic previous bytes deliberately remain cacheable after publication.
    // The new HTML must request new URLs, rather than accidentally refreshing them.
    if(typographyTransition&&url.searchParams.get('v')==='legacy-typography-fixture'){
      if(file==='assets/site.js')body=Buffer.from('window.__cachedTypographyFixture="old";');
      if(file==='assets/site.css')body=Buffer.from('body{font-family:Georgia;font-size:30px}');
    }
    const type=html?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'ETag':etag,'Cache-Control':html?'max-age=0, must-revalidate':'public, max-age=3600'});res.end(body);
  });return {server,requests,publish(){version=2}};
}
module.exports={createCacheServer};
