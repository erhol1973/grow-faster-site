'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const read=file=>fs.readFileSync(path.join('dist',file),'utf8');
test('integrated public decision route has current self-only controls, shared final policy and no backend bootstrap',()=>{
 const html=read('decision-journey/index.html');assert.match(html,/decision-journey-page/);assert.match(html,/connect-src 'none'/);
 const csp=html.indexOf('http-equiv="Content-Security-Policy"');for(const tag of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["'][^"']+["'][^>]*>/g))assert(tag.index>csp,'CSP precedes every resource');
 assert.match(html,/id="site-return"[^>]*href="\.\.\/approach\.html\?lang=nl#decision-journey-entry"/);
 assert.doesNotMatch(html,/cms-config|cms-public|member-auth|hsforms|analytics|hubspot/i);
 assert.equal((html.match(/href=["'][^"']*typography\.css[^"']*["']/g)||[]).length,1);
 const app=read('decision-journey/assets/app.js');assert.match(app,/new URLSearchParams\(location\.search\)\.get\('lang'\)/);assert.match(app,/requestedLanguage==='fr'\?'fr':'nl'/);assert.match(app,/siteReturn\.href='\.\.\/approach\.html\?lang='\+state\.lang/);
 const entry=read('approach.html');assert.match(entry,/id="decision-journey-entry"/);assert.match(entry,/id="decision-journey-open"[^>]*href="decision-journey\/\?lang=nl"/);
});
test('integrated pure models use exactly the source bytes tested by the independent model fixtures',()=>{
 for(const name of ['cases.js','model.js','roadmap.js','value-review.js']){
  const source=fs.readFileSync('decision-journey/assets/'+name),built=fs.readFileSync('dist/decision-journey/assets/'+name);
  assert.equal(crypto.createHash('sha256').update(built).digest('hex'),crypto.createHash('sha256').update(source).digest('hex'),name);
 }
});
test('new decision route has finite separate transfer budgets and preserves old Lighthouse sample family',()=>{
 const budgets={'index.html':10000,'assets/app.js':70000,'assets/cases.js':22000,'assets/model.js':10000,'assets/roadmap.js':22000,'assets/value-review.js':22000,'assets/canvas.css':26000,'assets/logo.svg':12000};
 for(const [file,max]of Object.entries(budgets))assert(fs.statSync('dist/decision-journey/'+file).size<=max,file+' budget '+max);
 const performance=fs.readFileSync('scripts/performance.cjs','utf8');for(const page of ['/index.html','/coherence.html','/approach.html','/about.html','/eca.html','/workshop.html','/books.html','/insights.html','/executive-radar/','/decision-journey/'])assert(performance.includes("'"+page+"'"),page);
 assert.match(performance,/runs=production\?1:3/);assert.match(performance,/\['mobile','desktop'\]/);
});
test('new decision route excludes all audit/test/private implementation files from its public subtree',()=>{
 const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else files.push(path.relative('dist/decision-journey',file).replaceAll('\\','/'));}}walk('dist/decision-journey');
 assert.deepEqual(files.sort(),['index.html',...['app.js','canvas.css','cases.js','logo.svg','model.js','roadmap.js','value-review.js'].map(f=>'assets/'+f)].sort());
});
