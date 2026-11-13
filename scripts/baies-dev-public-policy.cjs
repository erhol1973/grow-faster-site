'use strict';
// Publication boundary for the removed internal Radar About / sprint roadmap.
// This module is deliberately outside public build allowlists. It never mutates content.
const fs=require('node:fs'),path=require('node:path');
const {readRegularFile}=require('./file-reader.cjs');
const {isUtf8}=require('node:buffer');
const textExtensions=new Set(['.html','.htm','.xhtml','.js','.mjs','.cjs','.json','.txt','.svg','.xml']);
function decodePolicyText(value){
  return String(value).replace(/\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi,(whole,a,b,c)=>{const n=parseInt(a||b||c,16);return n<=0x10ffff?String.fromCodePoint(n):whole;})
    .replace(/&#x([0-9a-f]+);?|&#(\d+);?/gi,(whole,hex,decimal)=>{const n=parseInt(hex||decimal,hex?16:10);return n<=0x10ffff?String.fromCodePoint(n):whole;})
    .replace(/&(nbsp|middot|rsquo|lsquo|apos|quot|amp);/gi,(_,key)=>({nbsp:' ',middot:'·',rsquo:'’',lsquo:'‘',apos:"'",quot:'"',amp:'&'}[key.toLowerCase()]));
}
function attributeValues(text,name){const pattern=new RegExp(String.raw`(?:^|[\s<])${name}\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s<>]+))`,'gi');return [...text.matchAll(pattern)].map(match=>match[1]??match[2]??match[3]);}
function inspectPublicText(name,text){
  const decoded=decodePolicyText(text),flat=decoded.replace(/<[^>]*>/g,' ').replace(/\s+/g,' '),findings=[];
  const ids=attributeValues(decoded,'id'),views=attributeValues(decoded,'data-view'),hrefs=attributeValues(decoded,'href');
  const add=rule=>findings.push(`${name}: internal Executive Radar content (${rule})`);
  if(/\bOver\s+(?:Executive\s+Radar|BAEIS)\b|(?:À|A)\s+propos\s+d[’'‘]?\s*Executive\s+Radar|(?:À|A)\s+propos\s+de\s+BAEIS/i.test(flat))add('removed NL/FR About label');
  if(/\b(?:navModel|roadmapKicker|roadmapTitle|roadmapSub|s[1-4](?:Title|Text|Done))\b/.test(decoded))add('removed roadmap runtime keys');
  if(/\bProduct\s+Owner\s*[·:—–-]?\s*(?:4\s+Sprint\s+Proof\s+of\s+Concept|Prototype\s+en\s+4\s+sprints)\b/i.test(flat))add('internal four-sprint owner roadmap');
  if(/Vier doelgerichte increments binnen één geïsoleerde ontwikkelroute|Quatre incréments réunis dans un environnement isolé|Wat bewust nog niet gebouwd is|Ce qui n[’']est pas encore construit|Een werkende multi-agentruntime, automatische wetenschappelijke factchecking|Agents autonomes réels, vérification scientifique automatisée, écriture Supabase|Nieuwsbriefinschrijving\s*[—–-]\s*toestemmingsprototype|Inscription newsletter\s*[—–-]\s*test de consentement/i.test(flat))add('removed internal roadmap or signup copy');
  if(attributeValues(decoded,'class').some(value=>value.split(/\s+/).includes('sprint-grid')))add('internal sprint-grid markup');
  const radarContext=/(?:^|\/)(?:executive-radar|baies-dev)(?:\/|[.]html|$)|(?:^|\/)baies-dev-app[.]js(?:$|[?])/i.test(name.replaceAll('\\','/'))||ids.includes('product-links')||/\bBAEIS_DEV_(?:CORE|DATA)\b/.test(decoded);
  if((radarContext&&(hrefs.includes('#about')||ids.some(value=>['about','heading-about'].includes(value))||views.includes('about')||/\b(?:about\s*:\s*["']navModel["']|views\s*=\s*\[[^\]]*["']about["'])/.test(decoded)))||/\/(?:executive-radar|baies-dev)\/[^"'<>\s]*#about\b/i.test(decoded))add('removed Radar About route or DOM');
  if(radarContext&&/\b(?:nextTitle|nextBody|signupTitle|signupDesc|signupMessage|testSignup)\b|\bid\s*=\s*["']signup-(?:form|email|consent|feedback)["']/i.test(decoded))add('removed Radar roadmap or signup payload');
  return findings;
}
function isPolicyPayload(name,bytes){
  if(textExtensions.has(path.extname(name).toLowerCase()))return true;
  if(/\.(?:pdf|mp4|jpg|jpeg|png|webp|avif|ico|woff2?|ttf|otf)$/i.test(name))return false;
  // Inspect every UTF-8 text payload, irrespective of its name or location. CSS rules
  // alone are allowed: only actual internal markup, keys and precise copy are banned.
  return !bytes.includes(0)&&isUtf8(bytes);
}
function scanPublicArtifact(root){
  const findings=[];const absolute=path.resolve(root);
  function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(folder,entry.name),name=path.relative(absolute,file).replaceAll('\\','/');
    if(entry.isSymbolicLink()){findings.push(`${name}: public artifact symbolic link rejected`);continue;}
    if(entry.isDirectory()){walk(file);continue;}
    if(!entry.isFile()){findings.push(`${name}: public artifact non-file rejected`);continue;}
    try{const bytes=readRegularFile(file);if(isPolicyPayload(name,bytes))findings.push(...inspectPublicText(name,bytes.toString('utf8')));}catch{findings.push(`${name}: public artifact could not be safely inspected`);}
  }}
  try{const stat=fs.lstatSync(absolute);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('unsafe artifact root');walk(absolute);}catch{findings.push('Public artifact directory is missing or cannot be safely inspected');}
  return findings;
}
function assertPublicArtifact(root){const findings=scanPublicArtifact(root);if(findings.length){const error=new Error('Executive Radar public-content policy rejected artifact:\n'+findings.join('\n'));error.code='RADAR_INTERNAL_CONTENT';error.findings=findings;throw error;}return true;}
module.exports={decodePolicyText,inspectPublicText,isPolicyPayload,scanPublicArtifact,assertPublicArtifact};

if(require.main===module){const artifact=path.resolve(process.argv[2]||path.join(__dirname,'..','dist'));try{assertPublicArtifact(artifact);console.log('Executive Radar public-content policy passed.');}catch(error){console.error(error.message);process.exitCode=1;}}
