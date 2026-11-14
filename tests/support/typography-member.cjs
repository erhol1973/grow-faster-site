'use strict';
const assert=require('node:assert/strict');
// Synthetic entitlement, exact approved private publications. Production readers
// still fetch, validate and mount their own payload; no DOM injection/unhiding.
async function memberEdition(page,kind,info){
 if(!['journal','radar'].includes(kind))throw Error('Unsupported typography publication');
 info.annotations.push({type:'auth-evidence',description:'Synthetic member entitlement; approved '+kind+' payload through ordinary production reader. Not native-provider authorization evidence.'});
 const requests=[];
 await page.route('**/assets/member-auth.js*',route=>route.fulfill({contentType:'application/javascript',body:"window.GFMember={ready:async()=>({id:'synthetic-typography-member'}),accountUrl:()=>'/account.html',request:path=>fetch('/__typography_member_fixture/'+path.split('/').pop())};"}));
 let content,image;
 if(kind==='journal'){
  const archive=require('../../scripts/journal-archive.cjs');
  content={nl:archive.edition('nl').payload,fr:archive.edition('fr').payload};image=archive.cartoon();
 }else content=require('../../scripts/radar-release.cjs').edition();
 await page.route('**/__typography_member_fixture/*',async route=>{
  const request=route.request(),file=new URL(request.url()).pathname.split('/').pop();requests.push({file,method:request.method()});
  if(request.method()!=='GET')return route.abort();
  if(kind==='journal'){
   if(file==='cartoon.webp')return route.fulfill({contentType:'image/webp',body:image});
   if(!['nl.json','fr.json'].includes(file))return route.abort();
   return route.fulfill({contentType:'application/json',body:content[file.slice(0,2)]});
  }
  if(file!=='current.json')return route.abort();
  return route.fulfill({contentType:'application/json',body:JSON.stringify(content)});
 });
 return {async assertRead(){assert(requests.some(r=>kind==='journal'?/^(nl|fr)\.json$/.test(r.file):r.file==='current.json'),'production reader must request its publication');assert(requests.every(r=>r.method==='GET'),'fixture cannot write');await info.attach('synthetic-member-publication-requests',{body:JSON.stringify({kind,syntheticAuth:true,requests},null,2),contentType:'application/json'});}};
}
module.exports={memberEdition};
