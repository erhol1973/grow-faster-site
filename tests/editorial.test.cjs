const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','dist');
test('published language markers and structured data support only English, Dutch and French',()=>{
 for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){const s=fs.readFileSync(path.join(root,file),'utf8');assert.doesNotMatch(s,/(?:data-lang|data-article-lang|lang)="de"|content="de_DE"/,file);
  for(const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){const visit=o=>{if(!o||typeof o!=='object')return;if(o.inLanguage){if(Array.isArray(o.inLanguage))assert.deepEqual(o.inLanguage,['en','nl','fr'],file);else assert.ok(['en','nl','fr'].includes(o.inLanguage),file);}for(const v of Object.values(o))if(typeof v==='object')Array.isArray(v)?v.forEach(visit):visit(v)};visit(JSON.parse(m[1]));}
 }
 const sim=fs.readFileSync(path.join(root,'coherence-sim.html'),'utf8');const tx=JSON.parse(sim.match(/^const TX=(\{.*\});$/m)[1]);assert.deepEqual(Object.keys(tx).sort(),['en','fr','nl']);
 const translations=fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8').match(/^window\.I18N=(\{[\s\S]*\});\s*window\.I18N_HTML=(\{[\s\S]*\});\s*$/);for(const group of translations.slice(1))for(const [key,value]of Object.entries(JSON.parse(group)))if(Array.isArray(value)){assert.equal(value.length,2,key);assert.ok(value.every(x=>typeof x==='string'&&x.length>0),key);}
});
