'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {routes,deliveryIssues,languageCases}=require('../scripts/typography-audit.cjs');
test('every built document delivers the canonical policy after component styles',()=>{
 const inventory=routes();assert(inventory.includes('/transformation.html'));assert(inventory.includes('/admin.html'));assert(inventory.includes('/baies-dev/index.html'));
 for(const route of inventory)assert.deepEqual(deliveryIssues(fs.readFileSync(path.join('dist',route),'utf8')),[],route);
});
test('delivery gate rejects a missing policy or a later component stylesheet',()=>{
 assert.notDeepEqual(deliveryIssues('<head><link rel="stylesheet" href="assets/site.css"></head>'),[]);
 assert.notDeepEqual(deliveryIssues('<head><link rel="stylesheet" href="assets/typography.css"><style>h2{font-size:5px}</style></head>'),[]);
 assert.deepEqual(deliveryIssues('<head><style>h2{font-size:5px}</style><link rel="stylesheet" href="../../assets/typography.css?v=1"></head>'),[]);
});
test('component CSS cannot compete with the canonical font and role priority',()=>{
 for(const file of fs.readdirSync('assets').filter(f=>f.endsWith('.css')&&f!=='typography.css')){
  assert.doesNotMatch(fs.readFileSync(path.join('assets',file),'utf8'),/(?:^|[;{])\s*(?:font-size|font-family|font)\s*:[^;{}]*!important\b/i,file);
 }
});
test('simulator subsections follow their section H2 as H3 and retain CMS identities',()=>{
 const html=fs.readFileSync('approach.html','utf8');
 const form=html.match(/<form\b[^>]*id="simf"[^>]*>([\s\S]*?)<\/form>/)?.[1];assert(form,'simulator form exists');
 assert.equal((form.match(/<h3\b/g)||[]).length,3);assert.doesNotMatch(form,/<h4\b/);
 for(const key of ['f2f8deeb3ee65-0','f2ff11385f903-0','fd0854702eaf8-0'])assert.match(form,new RegExp('<h3\\b[^>]*data-cms="'+key+'"'));
});
test('simulator table renderers expose row and column headers without changing numeric cells',()=>{
 const vm=require('node:vm'),source=fs.readFileSync('assets/site.js','utf8');
 const head=source.match(/const head=`<thead>[^\r\n]+/)?.[0],row=source.match(/const row=\(lbl,f,cls\)=>[^\r\n]+/)?.[0],brow=source.match(/const brow=\(lbl,f,cls\)=>[^\r\n]+/)?.[0];
 assert(head&&row&&brow,'production table renderers exist');
 const context={t:s=>s,sc:[{n:'Assisted'},{n:'Agentic'},{n:'Reinvented'}],fl:[{h:4},{h:3},{h:2},{h:1}],bc:[{value:10},{value:20},{value:30}]};
 const rendered=vm.runInNewContext(head+'\n'+row+'\n'+brow+'\n({head,flow:row("Handoffs",x=>x.h),business:brow("Net value",x=>x.value)})',context);
 assert.equal((rendered.head.match(/<th scope="col">/g)||[]).length,4);
 assert.match(rendered.head,/<tr><td><\/td><th scope="col">Today<\/th>/);assert.doesNotMatch(rendered.head,/<th[^>]*><\/th>/);
 assert.match(rendered.flow,/<th scope="row">Handoffs<\/th>/);assert.match(rendered.business,/<th scope="row">Net value<\/th>/);
 assert.deepEqual([...rendered.flow.matchAll(/<td(?: class="top")?>([^<]+)<\/td>/g)].map(m=>m[1]),['4','3','2','1']);
 assert.deepEqual([...rendered.business.matchAll(/<td(?: class="top")?>([^<]+)<\/td>/g)].map(m=>m[1]),['10','20','30']);
 assert.match(source,/\$\("#bc-t"\)\.innerHTML=`<table><thead><tr><td><\/td>\$\{sc\.map\(x=>`<th scope="col">/);
});
test('book reading keys preserve native inner scrolling and document-level page navigation',()=>{
 const vm=require('node:vm');
 for(const file of ['boek/index.html','boek/the-coherent-enterprise/index.html']){
  const source=fs.readFileSync(file,'utf8');
  const handler=[...source.matchAll(/document\.addEventListener\('keydown', e => \{[\s\S]*?\r?\n\}\);/g)].at(-1)?.[0];assert(handler,file+' has document keyboard handling');
  const calls=[];let listener;
  const noop=()=>{};
  const context={document:{addEventListener:(name,fn)=>{listener=fn;},body:{classList:{contains:()=>false}}},openPanel:null,zoom:1,N:22,next:()=>calls.push('next'),prev:()=>calls.push('prev'),goto:n=>calls.push(n),zoomIn:noop,zoomOut:noop,fitPage:noop,toggleFull:noop,openThumbs:noop,openDrawer:noop,toggleNight:noop,setPresent:noop,wake:noop,$:noop};
  vm.runInNewContext(handler,context);
  const event=(key,reading,chart=false)=>({key,target:{closest:selector=>(selector==='#book .pg'&&reading)||(selector==='.heat-scroll,.diagram-scroll,.typography-diagram-scroll'&&chart)?{}:null},preventDefault(){this.defaultPrevented=true;},defaultPrevented:false});
  for(const key of ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ']){
   const e=event(key,true);listener(e);assert.equal(e.defaultPrevented,false,file+' '+key+' remains native');assert.deepEqual(calls,[]);
  }
  for(const key of ['ArrowLeft','ArrowRight','Home','End']){
   const e=event(key,true,true);listener(e);assert.equal(e.defaultPrevented,false,file+' '+key+' stays in focused chart');assert.deepEqual(calls,[]);
  }
  const end=event('End',false);listener(end);assert.equal(end.defaultPrevented,true);assert.deepEqual(calls,[22]);
  const right=event('ArrowRight',true);listener(right);assert.deepEqual(calls,[22,'next']);
  assert.match(source,/mobileScrollSupport: true, useMouseEvents: false/);
  assert.match(source,/reading\.tabIndex = 0/);assert.match(source,/reading\.setAttribute\('role', 'region'\)/);
  assert.match(source,/e\.target\.closest\('button, a, \.edge, \.pg'\)/);
 }
});
test('route locale coverage preserves fixed-language publications and real supported interfaces',()=>{
 for(const [route,language]of [['/journal.html','nl'],['/journal-fr.html','fr'],['/admin.html','nl'],['/boek/index.html','en'],['/boek/the-coherent-enterprise/index.html','en']])assert.deepEqual(languageCases(route),[{language,effectiveLanguage:language}]);
 for(const route of ['/executive-radar/index.html','/baies-dev/index.html'])assert.deepEqual(languageCases(route),[{language:'nl',effectiveLanguage:'nl-BE'},{language:'fr',effectiveLanguage:'fr-BE'}]);
 assert.deepEqual(languageCases('/transformation.html'),[{language:'nl',effectiveLanguage:'nl'},{language:'fr',effectiveLanguage:'fr'}]);
});
test('private workflow rail becomes keyboard reachable and named after insertion without exposing private HTML',()=>{
 const html=fs.readFileSync('scripts/radar-reference/template.html','utf8'),source=fs.readFileSync('assets/baies-dev-app.js','utf8');
 assert.match(html,/<div class="workflow-rail">/);assert.doesNotMatch(fs.readFileSync('executive-radar/index.html','utf8'),/class="workflow-rail"/);
 const fn=source.match(/function enhanceWorkflowRails\(\)\{[\s\S]*?\n  \}/)?.[0];assert(fn);
 const heading={id:'heading-editorial'},attrs={},rail={closest:()=>({querySelector:()=>heading}),setAttribute:(key,value)=>attrs[key]=value};
 require('node:vm').runInNewContext(fn+';enhanceWorkflowRails();',{document:{querySelectorAll:()=>[rail]}});
 assert.equal(rail.tabIndex,0);assert.equal(attrs.role,'region');assert.equal(attrs['aria-labelledby'],'heading-editorial');
 assert.match(html,/<h[1-6]\b[^>]*id="heading-editorial"[^>]*data-i18n="[^"]+"/);
});
test('graphic label tokens convert drawing units to one physical base size',()=>{
 const {rawLabelSize,svgUnitScale}=require('../assets/typography.js');
 assert.equal(rawLabelSize(12,{a:1,b:0,c:0,d:1}),12);
 assert.equal(rawLabelSize(12,{a:6,b:0,c:0,d:6}),2);
 assert.equal(rawLabelSize(12,{a:0,b:2,c:-2,d:0}),6);
 assert.equal(rawLabelSize(12,{a:1.5,b:0,c:0,d:1.5}),8);
 assert.equal(svgUnitScale({c:3,d:4}),5);
 assert.equal(rawLabelSize(12,null),null);assert.equal(rawLabelSize(12,{c:0,d:0}),null);
});
test('discretionary book title hyphenation preserves normalized search words',()=>{
 const vm=require('node:vm');
 const html=fs.readFileSync('boek/the-coherent-enterprise/index.html','utf8');
 assert.match(html,/<h1>Frag&shy;men&shy;ta&shy;tion lives between the parts<\/h1>/);
 const normalize=html.match(/const norm = s => [^\r\n]+/)?.[0];assert(normalize);
 assert.equal(vm.runInNewContext(normalize+'\nnorm("Frag\\u00admen\\u00adta\\u00adtion")'),'fragmentation');
 assert.match(html,/<h1>Most or&shy;gan&shy;i&shy;sa&shy;tions are not failing<\/h1>/);
 assert.equal(vm.runInNewContext(normalize+'\nnorm("or\\u00adgan\\u00adi\\u00adsa\\u00adtions")'),'organisations');
});
test('the graphic normalizer is the first deferred runtime on every source route',()=>{
 for(const route of routes()){
  const file=route==='/baies-dev/index.html'?'executive-radar/index.html':route.slice(1);
  const html=fs.readFileSync(file,'utf8');
  const first=[...html.matchAll(/<script\b[^>]*\bdefer\b[^>]*>/gi)][0]?.[0];
  assert(first&&first.includes('assets/typography.js'),route);
 }
});
test('roomier BPMN label slots preserve lane canvases and connection centres',()=>{
 const vm=require('node:vm'),source=fs.readFileSync('assets/site.js','utf8');
 const factory=source.slice(source.indexOf('const B_CFG='),source.indexOf('function fo('));assert(factory);
 const result=JSON.parse(JSON.stringify(vm.runInNewContext(factory+'\n({before:layout(B_CFG),after:layout(A_CFG),smallWidth:2*hw(A_CFG,A_CFG.nodes[3]),smallHeight:2*hh(A_CFG,A_CFG.nodes[3])})')));
 assert.equal(result.before.W,1156);assert.equal(result.before.H,404);
 assert.equal(result.after.W,1210);assert.equal(result.after.H,660);
 assert.deepEqual(result.before.pos[0],{x:114,y:48});assert.deepEqual(result.before.pos[1],{x:222,y:150});assert.deepEqual(result.before.pos[9],{x:1086,y:48});
 assert.deepEqual(result.after.pos[3],{x:501,y:241});assert.deepEqual(result.after.pos[8],{x:501,y:511});assert.deepEqual(result.after.pos[13],{x:1005,y:604});
 assert.equal(result.smallWidth,118);assert.equal(result.smallHeight,54);
});
test('heading reference expressions depend only on the independent numeric contract',()=>{
 const {headingReferenceCSS}=require('../scripts/typography-audit.cjs');
 const allowed=new Set(['min','vw','max']);
 const spec=new Proxy({min:40,vw:6,max:86},{get:(object,key)=>{assert(allowed.has(key),'must not read production styles or variables: '+String(key));return object[key];}});
 assert.equal(headingReferenceCSS(spec),'clamp(40px,6vw,86px)');
 assert.notEqual(headingReferenceCSS({min:17,vw:0,max:17,productionCSS:'var(--type-h1)'}),'clamp(40px,6vw,86px)','body contract cannot silently become H1');
 assert.equal(headingReferenceCSS({min:40,vw:7,max:86,productionCSS:'clamp(40px,6vw,86px)'}),'clamp(40px,7vw,86px)','wrong slope is exposed rather than copied from production');
 for(const bad of [{min:'var(--type-h1)',vw:6,max:86},{min:40,vw:-1,max:86},{min:90,vw:6,max:86},{min:40,vw:NaN,max:86}])assert.throws(()=>headingReferenceCSS(bad));
});
test('book search snippets and DOM ranges keep original soft-hyphen offsets',()=>{
 const vm=require('node:vm');
 for(const file of ['boek/index.html','boek/the-coherent-enterprise/index.html']){
  const source=fs.readFileSync(file,'utf8'),begin=source.indexOf('const norm = s =>'),end=source.indexOf('\nfunction runSearch()',begin);assert(begin>=0&&end>begin);
  const helpers=source.slice(begin,end);
  const result=JSON.parse(JSON.stringify(vm.runInNewContext(helpers+'\n({word:searchMatch("Most or\\u00adgan\\u00adi\\u00adsa\\u00adtions are not failing","organisations"),fragment:searchMatch("Frag\\u00admen\\u00adta\\u00adtion lives", "fragmentation"),snippet:snippet("Most or\\u00adgan\\u00adi\\u00adsa\\u00adtions are not failing", "organisations"),accent:searchMatch("caf\\u0065\\u0301", "cafe")})')));
  assert.deepEqual(result.word,{start:5,end:22});assert.deepEqual(result.fragment,{start:0,end:16});
  assert.equal(result.snippet,'Most <mark>organisations</mark> are not failing');assert.deepEqual(result.accent,{start:0,end:5});
 }
});
test('source and built HTML invalidate cached copies of the finite changed asset set',()=>{
 const version='20261114-integration';
 const changed=new Set(['assets/site.js','assets/site.css','assets/journal.css','assets/monthly-reader.css','assets/workshop.css','assets/baies-dev.css','assets/baies-dev-app.js','assets/typography.css','assets/typography.js','assets/book-reading.css']);
 // Public source routes are filesystem content, not a Git trust operation.
 // Include root pages, both readers, the radar source and legacy article routes.
 const source=fs.readdirSync('.',{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.html')).map(entry=>entry.name);
 function sourceHTML(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())sourceHTML(full);else if(entry.isFile()&&entry.name.endsWith('.html'))source.push(full.replaceAll('\\','/'));}}
 for(const dir of ['boek','executive-radar','articles-1'])sourceHTML(dir);
 const built=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.html'))built.push(path.relative('dist',full).replaceAll('\\','/'));}}walk('dist');
 for(const [root,files]of [['.',source],['dist',built]]){
  const seen=new Set();
  for(const file of files)for(const match of fs.readFileSync(path.join(root,file),'utf8').matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']+)\1/gi)){
   const url=match[2].replace(/&amp;/g,'&');if(/^[a-z]+:/i.test(url))continue;
   const [location]=url.split('#'),[base,query='']=location.split('?');
   const target=base.startsWith('/')?base.slice(1):path.posix.normalize(path.posix.join(path.posix.dirname(file),base));
   if(!changed.has(target))continue;seen.add(target);
   assert.deepEqual(new URLSearchParams(query).getAll('v'),[version],root+'/'+file+' '+target+' must bypass its previous cached asset');
  }
  // New HTML can deliver the exact component bytes inline; those bytes cannot
  // be a stale cached stylesheet response. Standalone fallback is still present.
  for(const file of files)for(const match of fs.readFileSync(path.join(root,file),'utf8').matchAll(/<style data-gf-component-style="([^"]+)">([\s\S]*?)<\/style>/g)){
   if(!changed.has(match[1]))continue;seen.add(match[1]);assert.equal(match[2],fs.readFileSync(path.join(root,match[1]),'utf8'),file+' exact inline source and standalone fallback');
  }
  assert.deepEqual([...seen].sort(),[...changed].sort(),root+' covers every changed asset, including aliases/readers');
 }

});
