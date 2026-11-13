'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const helper=require('../scripts/coherence-dictionary.cjs'),contract=require('../scripts/coherence-dictionary.contract.json');
const evaluate=source=>{const context={window:{}};vm.runInNewContext(source,context);return JSON.parse(JSON.stringify(context.window));};
test('Coherence chunk preserves its monotone retention floor, all original tuples and every HTML map',()=>{
 const fullText=fs.readFileSync('dist/assets/i18n.js','utf8'),full=evaluate(fullText),chunkText=fs.readFileSync('dist/assets/i18n-coherence.js','utf8'),chunk=evaluate(chunkText),original=evaluate(fs.readFileSync('assets/i18n.js','utf8'));
 assert.deepEqual(full,original,'full source data remains available to all other and cached pages');
 helper.assertRetentionFloor(contract);assert.equal(Object.keys(chunk.I18N).length,contract.retainedKeys.length);
 for(const key of contract.retainedKeys)assert.deepEqual(chunk.I18N[key],full.I18N[key],key);
 assert.deepEqual(chunk.I18N_HTML,full.I18N_HTML);assert.equal(Object.keys(chunk.I18N_HTML).length,9);
 const model=require('../assets/models.js'),labels=new Set();
 for(const complexity of [1,5])for(const value of [1,5])for(const risk of [1,5])for(const readiness of [1,5]){const result=model.classify({value,complexity,coord:complexity,handoffs:complexity,decision:complexity,personal:complexity,scale:value,risk,data:readiness,repeat:readiness,exceptions:6-readiness});labels.add(result.cls);labels.add(result.fin);}
 assert.deepEqual([...labels].sort(),['Agent-enable','Augment','Automate','Prepare first','Reinvent'].sort());for(const label of labels)assert.deepEqual(chunk.I18N[label],full.I18N[label],label+' finite model key');
 assert.ok(zlib.brotliCompressSync(chunkText,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:7}}).length<zlib.brotliCompressSync(fullText,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:7}}).length*.6);
 const html=fs.readFileSync('dist/coherence.html','utf8');assert.match(html,/i18n-coherence\.js\?v=coherence-1-[a-f0-9]{12}/);assert.doesNotMatch(html,/src="assets\/i18n\.js/);
 for(const name of ['index.html','about.html','insights.html'])assert.match(fs.readFileSync('dist/'+name,'utf8'),/src="assets\/i18n\.js\?v=20261111-nl-audit"/);
 for(const change of [contract.retainedKeys.slice(1),[contract.retainedKeys[1],contract.retainedKeys[0],...contract.retainedKeys.slice(2)]])assert.throws(()=>helper.assertRetentionFloor({...contract,retainedKeys:change}),/retention floor/);
 assert.throws(()=>helper.assertRetentionFloor({...contract,retainedKeys:[...contract.retainedKeys,'future reviewed key']}),/retention floor/,'new keys also require an explicit approved-floor advance');
});
test('selection only removes proven other-page text while protecting entities, whitespace, literal escapes, concatenation and unknown keys',()=>{
 const keys=['Other paragraph','A & B','Unicode é','Quoted "word"','joined phrase','continued word','Unknown dynamic paragraph'];const dictionary=Object.fromEntries(keys.map(key=>[key,[key+' NL',key+' FR']]));
 const runtimeSources={example:'const a="Unicode \\u00e9",b="Quoted \\"word\\"",c="joined "+"phrase",d="continued \\\nword";'};
 const selected=helper.selectDictionary({dictionary,htmlDictionary:{x:['NL','FR']},coherenceHTML:'<h1>A &amp;\n B</h1>',runtimeSources,otherHTML:['<p title=">">Other paragraph</p><p>A &amp; B</p><p>Unicode é</p><p>Quoted &quot;word&quot;</p><p>joined phrase</p><p>continued word</p>'],retainedKeys:[]});
 assert.equal(selected.dictionary['Other paragraph'],undefined);
 for(const key of keys.slice(1))assert.deepEqual(selected.dictionary[key],dictionary[key],key);
 assert.deepEqual(selected.htmlDictionary,{x:['NL','FR']});
 assert.deepEqual(helper.textNodes('<script>Not copy</script><style>Not copy</style><!-- Not copy --><p title=">">Real copy</p>').filter(Boolean),['Real copy']);
 assert.throws(()=>helper.selectDictionary({dictionary,htmlDictionary:{},coherenceHTML:'Unknown &futureEntity;',runtimeSources:{},otherHTML:[],retainedKeys:[]}),/Unknown entity/);
 const unknownEntity=helper.selectDictionary({dictionary,htmlDictionary:{},coherenceHTML:'',runtimeSources:{},otherHTML:['<p>Other &futureEntity; paragraph</p>'],retainedKeys:[]});assert.ok(unknownEntity.dictionary['Other paragraph']);
});
test('new unclassified dynamic lookup or escape syntax cannot bypass the pinned runtime-family review',()=>{
 const sources=Object.fromEntries(Object.keys(contract.runtimeHashes).map(name=>[name,fs.readFileSync('assets/'+name,'utf8')]));helper.assertRuntimeContract(sources,contract);helper.assertRuntimeContract(Object.fromEntries(Object.entries(sources).map(([name,text])=>[name,text.replace(/\r\n/g,'\n').replace(/\n/g,'\r\n')])),contract);
 for(const addition of [';t(remoteLabel);',';t("future\\qsyntax");',';t(prefix + externalValue);'])assert.throws(()=>helper.assertRuntimeContract({...sources,'site.js':sources['site.js']+addition},contract),/runtime family changed: site.js/);
 assert.throws(()=>helper.assertRuntimeContract({...sources,'new-runtime.js':'t(remoteValue)'},contract),/inventory changed/);
 assert.throws(()=>helper.selectDictionary({dictionary:{},htmlDictionary:{},coherenceHTML:'',runtimeSources:{},otherHTML:[],retainedKeys:['old cached key']}),/Retained Coherence translation missing/);
});
