const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..','dist');
test('shared calculation and consent modules remain small standalone assets',()=>{
  for(const [file,limit]of Object.entries({'assets/models.js':18000,'assets/consent.js':2500}))assert.ok(fs.statSync(path.join(root,file)).size<=limit,`${file}: budget ${limit} exceeded`);
});
test('every menu destination stays within its 85KB HTML transfer budget',()=>{
  for(const file of [...new Set([...require('./navigation-cases.json').pages,...require('./navigation-cases.json').primary,'workshop.html'])].map(p=>p.endsWith('/')?p+'index.html':p))assert.ok(fs.statSync(path.join(root,file)).size<=85000,`${file} exceeds 85KB HTML budget`);
});
test('shared JS/CSS and raster images stay within measured release budgets',()=>{const budgets={'assets/site.css':125000,'assets/site.js':55000,'assets/i18n.js':260000,'assets/content.js':23000,'assets/ux.js':15000,'assets/books.css':8000,'assets/navigation.css':8000,'assets/journal.css':6000,'assets/workshop.css':18000,'assets/workshop.js':8500};for(const [file,max]of Object.entries(budgets))assert.ok(fs.statSync(path.join(root,file)).size<=max,`${file} exceeds ${max} byte budget`);function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(jpe?g|png|webp|avif)$/i.test(p))assert.ok(fs.statSync(p).size<=700000,`${path.relative(root,p)} exceeds 700KB image budget`)}}walk(path.join(root,'img'))});

test('member controls share the models response and retain guarded post-DOM boot and standalone fallback',()=>{
 const vm=require('node:vm'),sourceRoot=path.join(__dirname,'..'),{bundleMemberNavigation}=require('../scripts/member-navigation.cjs');
 const read=name=>fs.readFileSync(path.join(sourceRoot,'assets',name),'utf8');
 const standalone=bundleMemberNavigation(read('member-menu.js'),'assets/member-menu.js',sourceRoot);
 const models=bundleMemberNavigation(read('models.js'),'assets/models.js',sourceRoot);
 assert.ok(models.includes(standalone),'same complete config/auth/menu bytes');
 const noDocument={};vm.runInNewContext(models,noDocument);assert.ok(noDocument.GFModels,'models remain usable without a DOM');
 assert.equal(bundleMemberNavigation(read('site.js'),'assets/site.js',sourceRoot),read('site.js'),'site source needs no loader');
 assert.ok(Buffer.byteLength(models)<=18000);assert.ok(Buffer.byteLength(read('site.js'))<=55000);
 for(const [hostname,nav,available,state] of [['127.0.0.1',true,true,'interactive'],['unapproved.example',true,false,'interactive'],['127.0.0.1',false,false,'interactive'],['127.0.0.1',true,true,'complete'],['127.0.0.1',true,true,'late-interactive']]){
  const listeners=[],tasks=[],events=[],window={location:{hostname},addEventListener:(type,fn,options)=>listeners.push({type,fn,options})},context={window,location:{origin:'https://'+hostname},setTimeout:fn=>tasks.push(fn),document:{readyState:state==='late-interactive'?'interactive':state,querySelector:selector=>selector==='nav.nav-executive'&&nav?{}:null,addEventListener:(type,fn,options)=>listeners.push({type,fn,options})}};
  let config,member;Object.defineProperty(window,'GF_CMS_CONFIG',{get:()=>config,set:value=>{events.push('config');config=value}});Object.defineProperty(window,'GFMember',{get:()=>member,set:value=>{events.push('auth');member=value}});
  vm.runInNewContext(models,context);assert.ok(context.GFModels);assert.equal(member,undefined);assert.equal(tasks.length,state==='complete'?1:0);
  if(state==='complete')assert.equal(listeners.length,0);else{assert.equal(listeners.length,2);assert.equal(listeners[0].type,'DOMContentLoaded');assert.equal(listeners[0].options.once,true);assert.equal(listeners[1].type,'load');assert.equal(listeners[1].options.once,true);if(state!=='late-interactive')listeners[0].fn();listeners[1].fn();}
  assert.equal(tasks.length,nav?1:0);assert.equal(member,undefined,'wait for existing DOM listeners');
  if(nav){tasks[0]();assert.deepEqual(events,['config','auth']);assert.equal(member.available,available);assert.equal(config.url,'https://gqsvoioccvklzfmdmexy.supabase.co');const original=member;vm.runInNewContext(standalone,context);assert.equal(member,original);assert.deepEqual(events,['config','auth'],'cached standalone cannot reboot identity');}
 }
 for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){const html=fs.readFileSync(path.join(root,name),'utf8');if(html.includes('nav-executive')&&/src="assets\/site\.js/.test(html)){assert.match(html,/src="assets\/models\.js\?[^"]*members=2/,name);assert.match(html,/src="assets\/site\.js\?[^"]*members=2/,name);}}
 const page='<nav class="nav nav-executive"></nav><head></head><li class="nav-action"></li><script defer src="assets/models.js?v=old"></script><script defer src="assets/site.js?v=old"></script>';
 const html=bundleMemberNavigation(page,'about.html',sourceRoot);assert.match(html,/models\.js\?v=old&amp;members=2/);assert.match(html,/site\.js\?v=old&amp;members=2/);assert.equal((html.match(/data-member-placeholder/g)||[]).length,1);
});
