const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');
const pages=fs.readdirSync(root).filter(p=>p.endsWith('.html'));
test('all documents have unique IDs and executable scripts parse',()=>{
 for(const page of pages){const html=fs.readFileSync(path.join(root,page),'utf8');const ids=[...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`${page}: duplicate ID`);
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc=|application\/ld\+json|type=["']application\/json/i.test(m[1]))continue;new vm.Script(m[2],{filename:page});}}
 for(const file of fs.readdirSync(path.join(root,'assets')).filter(p=>p.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,'assets',file),'utf8'),{filename:file});
});
test('local references resolve to real assets and document fragments',()=>{
 for(const page of pages){const html=fs.readFileSync(path.join(root,page),'utf8');for(const m of html.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)){let ref=m[1].replaceAll('&amp;','&');if(/^(?:[a-z]+:|\/\/)/i.test(ref))continue;const [url,fragment]=ref.split('#');const dest=path.resolve(root,path.dirname(page),decodeURIComponent((url.split('?')[0]||page).replace(/^\//,'' )||'index.html'));assert.ok(dest.startsWith(root+path.sep)||dest===root,`${page}: escaping reference ${ref}`);assert.ok(fs.existsSync(dest),`${page}: missing ${ref}`);if(fragment&&dest.endsWith('.html')){const target=fs.readFileSync(dest,'utf8');if(path.basename(dest)==='privacy.html'&&fragment==='cookies')continue;assert.ok(target.includes(`id="${fragment}"`)||target.includes(`id='${fragment}'`),`${page}: missing fragment ${ref}`);}}}
});
test('Insights cards expose exactly the four addressable article panels',()=>{const html=fs.readFileSync(path.join(root,'insights.html'),'utf8');for(const id of ['ai-pilot','no-ai-impact','friction-first','who-decides']){assert.match(html,new RegExp(`href="#${id}"`));assert.match(html,new RegExp(`id="${id}"`));}assert.match(html,/function fromHash/);});
test('public ordinary pages retain basic discovery and accessibility metadata',()=>{for(const page of pages.filter(p=>!['coherence-sim.html','insights-ai-pilot.html'].includes(p))){const html=fs.readFileSync(path.join(root,page),'utf8');assert.match(html,/<title>[^<]+<\/title>/i,page);assert.match(html,/<meta[^>]+name="viewport"/i,page);assert.match(html,/<meta[^>]+name="description"/i,page);assert.match(html,/<main\b/i,page);assert.match(html,/class="skip-link"/i,page);}});


