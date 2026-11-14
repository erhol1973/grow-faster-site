'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {readRegularFile}=require('./file-reader.cjs');
const {inspectPublicText}=require('./baies-dev-public-policy.cjs');
const root=path.resolve(__dirname,'..');
// Approved, sanitized main snapshot fb0c9b800ea6ba21af15cc4ed813cdda32b54aaa.
// These source references are never copied into the public artifact.
const templateHash='2a8408d7d15f2f860bbcf89eb50572a2034e016678f95081259aa0b9e423a6a7';
const payloadHash='08b1f5a9ea12117f424fb9c0a0df0871a84f5c3ef8248aab0dcdc87945842d3b';
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function referenceFile(name){
  if(!['template.html','data.cjs','copy.json'].includes(name))throw Error('Unknown Radar reference');
  return readRegularFile(path.join(__dirname,'radar-reference',name)).toString('utf8');
}
function assertProtectedEdition(value){
  if(!value||typeof value.body!=='string'||!Array.isArray(value.data?.records)||!value.copy?.nl||!value.copy?.fr)throw Error('Invalid protected Radar edition');
  // Inspect decoded components too: JSON quoting must not hide removed DOM or translations.
  const findings=[...inspectPublicText('executive-radar/member-template.html',value.body),
    ...inspectPublicText('executive-radar/member-data.json',JSON.stringify(value.data)),
    ...inspectPublicText('executive-radar/member-copy.json',JSON.stringify(value.copy))];
  if(findings.length){const error=Error('Executive Radar protected-content policy rejected edition:\n'+findings.join('\n'));error.code='RADAR_INTERNAL_CONTENT';throw error;}
  if(digest(value.body)!==templateHash)throw Error('Unexpected protected Radar template');
  if(digest(JSON.stringify(value))!==payloadHash)throw Error('Unexpected protected Radar payload');
  return true;
}
function edition(){
  const body=referenceFile('template.html').match(/<body>([\s\S]*?)<\/body>/i)?.[1];
  const context=vm.createContext({},{codeGeneration:{strings:false,wasm:false}});
  vm.runInContext(referenceFile('data.cjs'),context,{timeout:1000});
  const value=structuredClone({body,data:context.BAEIS_DEV_DATA,copy:JSON.parse(referenceFile('copy.json'))});
  assertProtectedEdition(value);return value;
}
function buildRadar(site,out){
  edition(); // Fail the build before an unsafe private edition can be provisioned.
  const preview=readRegularFile(path.join(site,'executive-radar/index.html')).toString('utf8')
    .replace('RADAR_BODY_SHA256',templateHash).replace('RADAR_PAYLOAD_SHA256',payloadHash);
  for(const route of ['executive-radar','baies-dev']){const dir=path.join(out,route);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),preview);}
}
if(require.main===module){
  const target=path.join(root,'reports/member-content/radar/current.json');
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(edition()),{encoding:'utf8',mode:0o600});
  console.log('Prepared reports/member-content/radar/current.json SHA256 '+payloadHash);
}
module.exports={buildRadar,edition,referenceFile,assertProtectedEdition,templateHash,payloadHash};
