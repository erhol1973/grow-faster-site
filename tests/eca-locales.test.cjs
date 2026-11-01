const {test}=require('node:test'),assert=require('node:assert/strict'),locale=require('../assets/eca-locales.js'),ECA=require('../assets/eca.js');
test('ECA language selection accepts the supported URL, site preference and browser languages in order',()=>{
 assert.equal(locale.resolveLanguage('fr','nl','en'),'fr');assert.equal(locale.resolveLanguage('de','nl','en'),'nl');assert.equal(locale.resolveLanguage(null,null,'fr-BE'),'fr');assert.equal(locale.resolveLanguage(null,'de','es'),'en');
});
test('every translated ECA phrase has complete Dutch and French copy',()=>{
 assert.ok(locale.dictionary['Show my coherence profile']);assert.ok(locale.dictionary['Your diagnostic request was submitted successfully.']);
 for(const [en,pair]of Object.entries(locale.dictionary)){assert.equal(pair.length,2,en);assert.ok(pair.every(v=>typeof v==='string'&&v.trim().length>0),en);assert.equal(locale.translate(en,'en'),en);assert.equal(locale.translate(en,'nl'),pair[0]);assert.equal(locale.translate(en,'fr'),pair[1])}
});
test('non-scalar answers and invalid numeric bands cannot become scored evidence',()=>{
 for(const value of [true,false,[1],[5],{},' 1','5 ','1.0',NaN,Infinity])assert.equal(ECA.value(value),null,JSON.stringify(value));
 for(const n of [-1,101,NaN,Infinity,null,'75'])assert.equal(ECA.band(n),null);
});
