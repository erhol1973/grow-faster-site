'use strict';
// Inert public interface data only. Never execute the application or a report.
const {literal,declaration,anchorCount,codeTokens}=require('./nl-member-copy.cjs');
const crypto=require('node:crypto');
function decisionCopy(source){
 const boundary='\nlet state,dirty=false,errors=[];';
 if(typeof source!=='string'||source.split(boundary).length!==2)throw Error('Decision interface boundary changed; review adapter');
 const prefix=source.slice(0,source.indexOf(boundary)),data=Object.fromEntries(['copy','planCopy','reviewCopy'].map(name=>[name,declaration(prefix,name)]));
 for(const value of Object.values(data))if(!value.nl||!value.fr)throw Error('Missing decision NL/FR branches');
 const tokens=codeTokens(prefix),names=['copy','planCopy','reviewCopy'];let actualOverlays=0;
 for(let i=0;i<tokens.length;i++){
  if(tokens[i]==='Object'&&tokens[i+1]==='.'&&tokens[i+2]==='assign'&&tokens[i+3]==='('&&names.includes(tokens[i+4]))actualOverlays++;
  if(!names.includes(tokens[i])||!['.','['].includes(tokens[i+1]))continue;
  const expression=tokens.slice(i,i+24);const end=expression.indexOf(';'),bounded=end<0?expression:expression.slice(0,end);
  if(bounded.includes('=')){
   const approved=tokens[i]==='copy'&&tokens[i+1]==='.'&&['nl','fr'].includes(tokens[i+2])&&tokens[i+3]==='.'&&tokens[i+4]==='languageNotice'&&tokens[i+5]==='=';
   if(!approved)throw Error('Unsupported decision copy mutation');
  }
 }
 const matches=[...prefix.matchAll(/^Object\.assign\((copy|planCopy|reviewCopy)\.(nl|fr),/gm)];
 if(matches.length!==actualOverlays)throw Error('Unsupported decision Object.assign form');
 // The only approved data overlays are literal Object.assign calls and the
 // two language-notice string assignments. No template/function/eval fallback.
 for(const match of matches){
  const parsed=literal(prefix,match.index+match[0].length);if(!prefix.slice(parsed.end).trimStart().startsWith(');')||!parsed.data||Array.isArray(parsed.data)||typeof parsed.data!=='object')throw Error('Executable decision copy overlay');
  if(anchorCount(prefix,prefix.slice(match.index,parsed.end)+');')!==1)throw Error('Decision copy overlay is not unique executable code');
  Object.assign(data[match[1]][match[2]],parsed.data);
 }
 for(const match of prefix.matchAll(/^copy\.(nl|fr)\.languageNotice=/gm)){
  const parsed=literal(prefix,match.index+match[0].length);if(typeof parsed.data!=='string'||!prefix.slice(parsed.end).trimStart().startsWith(';'))throw Error('Executable decision language notice');if(anchorCount(prefix,prefix.slice(match.index,parsed.end)+';')!==1)throw Error('Decision language notice is not unique executable code');data.copy[match[1]].languageNotice=parsed.data;
 }
 const blocks=[];function walk(key,value){if(typeof value==='string'){const text=value.replace(/<br\s*\/?\s*>/gi,' ').replace(/\s+/g,' ').trim();if(!text)throw Error('Empty decision copy');blocks.push({id:'static-decision-nl:'+key,page:'decision-journey/index.html',kind:'static-decision-copy',text,sha256:crypto.createHash('sha256').update(text).digest('hex'),source:{adapter:'inert-decision-copy',file:'decision-journey/assets/app.js',key,language:'nl',scope:'committed-public-interface-declarations-and-literal-overlays'}});}else if(Array.isArray(value))value.forEach((item,index)=>walk(key+'.'+index,item));else if(value&&typeof value==='object')Object.entries(value).forEach(([name,item])=>walk(key+'.'+name,item));else throw Error('Unsupported decision data');}
 for(const [name,value]of Object.entries(data)){if(!value.nl||!value.fr)throw Error('Missing decision NL/FR branches');walk(name+'.nl',value.nl);}
 return blocks;
}
module.exports={decisionCopy};
