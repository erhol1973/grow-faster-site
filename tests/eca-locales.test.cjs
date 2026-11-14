const {test}=require('node:test'),assert=require('node:assert/strict'),locale=require('../assets/eca-locales.js'),ECA=require('../assets/eca.js');
test('ECA language selection accepts the supported URL, site preference and browser languages in order',()=>{
 assert.equal(locale.resolveLanguage('fr','nl','en'),'fr');assert.equal(locale.resolveLanguage('de','nl','en'),'nl');assert.equal(locale.resolveLanguage(null,null,'fr-BE'),'fr');assert.equal(locale.resolveLanguage(null,'de','es'),'nl');
 assert.equal(locale.resolveLanguage('en','fr','en-GB'),'fr','English is no longer a site language');assert.equal(locale.resolveLanguage('en',null,'en-GB'),'nl','English falls back to Dutch');
});
test('every translated ECA phrase has complete Dutch and French copy',()=>{
 assert.ok(locale.dictionary['Show my coherence profile']);assert.ok(locale.dictionary['Your diagnostic request was submitted successfully.']);
 for(const [en,pair]of Object.entries(locale.dictionary)){assert.equal(pair.length,2,en);assert.ok(pair.every(v=>typeof v==='string'&&v.trim().length>0),en);assert.equal(locale.translate(en,'en'),en);assert.equal(locale.translate(en,'nl'),pair[0]);assert.equal(locale.translate(en,'fr'),pair[1])}
});

test('ECA description uses one stable source key across locale precedence, fallback and repeated NL/FR changes',()=>{
 const key='Assess how well your enterprise turns strategy into coordinated execution and measurable value across five coherence dimensions.';
 const expected={nl:'Verken hoe je onderneming strategie omzet in samenhangende uitvoering en meetbare waarde, vanuit vijf dimensies van samenhang.',fr:'Explorez comment votre entreprise traduit sa stratégie en une mise en œuvre cohérente et une valeur mesurable, selon cinq dimensions de cohérence.'};
 function initialize(requested,saved,browser){let change;const meta={content:expected.nl,setAttribute(name,value){assert.equal(name,'content');this.content=value;}},selector={value:'',addEventListener(name,fn){assert.equal(name,'change');change=fn;}},doc={documentElement:{lang:''},querySelector(q){if(q==='#ecaLanguage')return selector;if(q==='meta[name="description"]')return meta;throw Error('Unexpected metadata selector '+q);},createTreeWalker(){return{nextNode:()=>false}}};
  locale.init({location:{search:requested===null?'':'?lang='+encodeURIComponent(requested)},localStorage:{getItem:()=>saved},navigator:{language:browser}},doc);return{meta,selector,doc,select(value){selector.value=value;change();}};
 }
 for(const [requested,saved,browser,lang]of [['fr','nl','nl-BE','fr'],['nl','fr','fr-BE','nl'],[null,'fr','nl-BE','fr'],['unknown','fr','nl-BE','fr'],['en',null,'fr-BE','fr'],['unknown','de','es','nl'],[null,null,undefined,'nl']]){const f=initialize(requested,saved,browser);assert.equal(f.doc.documentElement.lang,lang);assert.equal(f.meta.content,expected[lang]);}
 const f=initialize('nl','fr','fr-BE');f.select('fr');assert.equal(f.meta.content,expected.fr);f.select('nl');assert.equal(f.meta.content,expected.nl);
 f.meta.content='A value that is not a dictionary key';locale.apply();assert.equal(f.meta.content,expected.nl,'never translate the current localized DOM value');f.select('unsupported');assert.equal(f.meta.content,expected.nl);
 assert.deepEqual(locale.dictionary[key],[expected.nl,expected.fr]);
 const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../eca.html'),'utf8');assert.ok(html.includes('<meta name="description" content="'+expected.nl+'">'));
});
test('non-scalar answers and invalid numeric bands cannot become scored evidence',()=>{
 for(const value of [true,false,[1],[5],{},' 1','5 ','1.0',NaN,Infinity])assert.equal(ECA.value(value),null,JSON.stringify(value));
 for(const n of [-1,101,NaN,Infinity,null,'75'])assert.equal(ECA.band(n),null);
});
