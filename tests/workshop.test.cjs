const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
test('workshop publishes only public content and keeps the approved commercial facts',()=>{
 const html=fs.readFileSync(path.join(root,'workshop.html'),'utf8');
 assert.match(html,/canonical" href="https:\/\/grow-faster\.be\/workshop\.html/);assert.doesNotMatch(html,/noindex|Voorvertoning|content\.json|aanbod-en-prijskeuze/);
 assert.match(html,/€2,750/);assert.match(html,/4–8 participants/);assert.match(html,/3\.5 hours/);assert.match(html,/request-form" novalidate/);
 for(const file of ['aanbodpagina.md','aanbod-en-prijskeuze.md','content.json','controle.cjs','vorige-versie.html'])assert.equal(fs.existsSync(path.join(root,file)),false,file);
});
test('every workshop reading phrase has Dutch and French copy',()=>{
 const html=fs.readFileSync(path.join(root,'workshop.html'),'utf8').match(/<main\b[\s\S]*?<\/main>/)[0],context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8'),context);
 const proper=new Set(['Erlend Hollebosch','The Coherent Enterprise','erlendhollebosch@gmail.com','· PDF']);
 for(const m of html.matchAll(/>([^<>]+)</g)){const text=m[1].trim().replace(/\s+/g,' ').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');if(!/[a-zA-Z]/.test(text)||proper.has(text))continue;const pair=context.window.I18N[text];assert.ok(pair,text);assert.equal(pair.length,2,text);assert.ok(pair.every(s=>typeof s==='string'&&s.trim()),text);}
});
test('workshop and its public resources are included in local load coverage',()=>{
 const {routes}=require('../scripts/load.cjs');for(const file of ['workshop.html','assets/workshop.css','assets/workshop.js'])assert.ok(routes.some(r=>r.route==='/'+file&&r.status===200),file);
});
