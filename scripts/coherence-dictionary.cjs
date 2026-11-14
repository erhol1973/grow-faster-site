'use strict';
// Bounded, data-only build optimization. No runtime translation API changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readRegularFile}=require('./file-reader.cjs');
const RUNTIME=['site.js','models.js','consent.js','ux.js','refinements.js','coherence-film.js','coherence-layout.js','cms-config.js','cms-client.js','cms-public.js','member-auth.js','member-menu.js','typography.js'];
const SOURCE_URL='assets/i18n-coherence.js?v=coherence-1';
const ORIGINAL_COUNT=666,ORIGINAL_HASH='86d82e745e11fb30056fb0b4a25d35c2a5065b97e72cff9d71350833802d6017';
// Advance only after an explicit append-only contract review; the original floor stays fixed.
const APPROVED_COUNT=666,APPROVED_HASH=ORIGINAL_HASH;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const named={amp:'&',gt:'>',lt:'<',quot:'"',apos:"'",nbsp:'\u00a0'};
function entities(text){let unknown=false;const value=text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(all,name)=>{if(name.startsWith('#')){const code=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):parseInt(name.slice(1),10);if(code>0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff))return String.fromCodePoint(code);unknown=true;return all;}if(Object.hasOwn(named,name))return named[name];unknown=true;return all;});return {value,unknown};}
const normalize=text=>text.replace(/\s+/gu,' ').trim();
function textNodes(html){const nodes=[];let cursor=0;while(cursor<html.length){const next=html.indexOf('<',cursor);if(next<0){nodes.push(html.slice(cursor));break;}nodes.push(html.slice(cursor,next));if(html.startsWith('<!--',next)){const end=html.indexOf('-->',next+4);if(end<0)throw Error('Unclosed HTML comment');cursor=end+3;continue;}let quote=null,end=next+1;for(;end<html.length;end++){const c=html[end];if(quote){if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='>')break;}if(end===html.length)throw Error('Unclosed HTML tag');const tag=html.slice(next,end+1),raw=tag.match(/^<(script|style)\b/i);cursor=end+1;if(raw){const closing=new RegExp('</'+raw[1]+'\\s*>','ig');closing.lastIndex=cursor;const match=closing.exec(html);if(!match)throw Error('Unclosed raw text element');cursor=closing.lastIndex;}}return nodes;}
function jsEscapes(text){return text.replace(/\\(?:\r\n|\n|\r|\u2028|\u2029)/g,'').replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi,(all,a,b,c)=>{const n=parseInt(a||b||c,16);return n<=0x10ffff?String.fromCodePoint(n):all;}).replace(/\\(["'`\\/])/g,'$1').replace(/\\[nrt]/g,' ');}

function assertRetentionFloor(contract){
 if(contract.version!==1||!Array.isArray(contract.retainedKeys)||new Set(contract.retainedKeys).size!==contract.retainedKeys.length||hash(JSON.stringify(contract.retainedKeys.slice(0,ORIGINAL_COUNT)))!==ORIGINAL_HASH||contract.retainedKeys.length!==APPROVED_COUNT||hash(JSON.stringify(contract.retainedKeys))!==APPROVED_HASH)throw Error('Coherence translation retention floor changed; original keys must remain an unchanged prefix');
}
function assertRuntimeContract(sources,contract){
 if(JSON.stringify(Object.keys(contract.runtimeHashes).sort())!==JSON.stringify(RUNTIME.toSorted())||JSON.stringify(Object.keys(sources).sort())!==JSON.stringify(RUNTIME.toSorted()))throw Error('Coherence runtime family inventory changed');
 for(const name of RUNTIME)if(hash(sources[name].replace(/\r\n/g,'\n'))!==contract.runtimeHashes[name])throw Error('Coherence runtime family changed: '+name+'; review dynamic lookups/escapes and update the explicit contract');
}
function selectDictionary({dictionary,htmlDictionary,coherenceHTML,runtimeSources,otherHTML,retainedKeys}){
 const protectedInputs=[coherenceHTML,...Object.values(runtimeSources)].flatMap(text=>{
  const decoded=entities(text);if(decoded.unknown)throw Error('Unknown entity in Coherence protected source; retain full data or review the contract');
  // Whole-source matching deliberately over-retains. Decode known literal escapes,
  // line continuations and literal-only concatenations; hash-pinned sources guard
  // any new unclassified computed lookup or escape syntax before this runs.
  const joined=text.replace(/(["'`])\s*\+\s*(["'`])/g,'');
  return [text,decoded.value,jsEscapes(text),jsEscapes(decoded.value),jsEscapes(joined)].map(normalize);
 });
 const copy=new Set();for(const html of otherHTML)for(const text of textNodes(html)){const decoded=entities(text);if(!decoded.unknown)copy.add(normalize(decoded.value));}
 const retained=new Set(retainedKeys);for(const key of retained)if(!Object.hasOwn(dictionary,key))throw Error('Retained Coherence translation missing: '+key);
 const result=Object.fromEntries(Object.entries(dictionary).filter(([key])=>retained.has(key)||protectedInputs.some(text=>text.includes(normalize(key))||text.includes(normalize(JSON.stringify(key).slice(1,-1))))||!copy.has(normalize(key))));
 return {dictionary:result,htmlDictionary};
}
function buildCoherenceDictionary(root,out){
 const target=path.join(out,'coherence.html'),page=readRegularFile(target).toString('utf8');
 if(!page.includes(SOURCE_URL))return false;
 const contract=JSON.parse(readRegularFile(path.join(root,'scripts/coherence-dictionary.contract.json')));
 assertRetentionFloor(contract);
 const runtimeSources=Object.fromEntries(RUNTIME.map(name=>[name,readRegularFile(path.join(root,'assets',name)).toString('utf8')]));assertRuntimeContract(runtimeSources,contract);
 const full=readRegularFile(path.join(out,'assets/i18n.js')).toString('utf8'),match=full.match(/^window\.I18N=(\{[\s\S]*\});\s*window\.I18N_HTML=(\{[\s\S]*\});\s*$/);
 if(!match)throw Error('Unexpected full translation data format');
 const otherHTML=fs.readdirSync(root).filter(name=>name.endsWith('.html')&&name!=='coherence.html').map(name=>readRegularFile(path.join(root,name)).toString('utf8'));
 const selected=selectDictionary({dictionary:JSON.parse(match[1]),htmlDictionary:JSON.parse(match[2]),coherenceHTML:readRegularFile(path.join(root,'coherence.html')).toString('utf8'),runtimeSources,otherHTML,retainedKeys:contract.retainedKeys});
 const newKeys=Object.keys(selected.dictionary).filter(key=>!contract.retainedKeys.includes(key));
 if(newKeys.length)throw Error('Append reviewed Coherence retention keys to the contract: '+newKeys.join(' | '));
 const data='window.I18N='+JSON.stringify(selected.dictionary)+';\nwindow.I18N_HTML='+JSON.stringify(selected.htmlDictionary)+';\n';
 fs.writeFileSync(path.join(out,'assets/i18n-coherence.js'),data);
 fs.writeFileSync(target,page.replaceAll(SOURCE_URL,SOURCE_URL+'-'+hash(data).slice(0,12)));
 return true;
}
module.exports={SOURCE_URL,entities,textNodes,jsEscapes,assertRetentionFloor,assertRuntimeContract,selectDictionary,buildCoherenceDictionary};
