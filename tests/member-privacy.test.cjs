'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const privacy=fs.readFileSync('privacy.html','utf8');
const auth=fs.readFileSync('assets/member-auth.js','utf8');
test('NL/FR membership privacy describes the real browser session and email-flow state',()=>{
 for(const lang of ['nl','fr']){
  const block=privacy.match(new RegExp('<div data-member-privacy="'+lang+'">([\\s\\S]*?)</div>'))?.[1];
  assert.ok(block,lang);
  for(const term of ['Supabase','sessionStorage','localStorage','nonce','mode','returnTo','end'])assert.ok(block.includes(term),lang+' '+term);
  assert.match(block,lang==='nl'?/maximaal één uur/:/maximale d’une heure/);
  assert.match(block,lang==='nl'?/niet automatisch in voor de nieuwsbrief/:/ne vous inscrit pas automatiquement à la newsletter/);
  assert.match(block,lang==='nl'?/niet automatisch alleen door het verstrijken van de tijd verwijderd/:/seul écoulement du temps ne le supprime pas automatiquement/);
  assert.match(block,lang==='nl'?/wachtwoord niet in lokale browseropslag/:/ne conserve pas votre mot de passe dans le stockage local/);
  assert.doesNotMatch(block,/art\.\s*6|Data Privacy Framework|standardcontract|clauses contractuelles|maximaal 2 jaar/i,'new factual disclosure must not invent legal bases, transfer or provider-retention terms');
 }
 assert.match(auth,/sessionStorage\.setItem\(key, JSON\.stringify\(session\)\)/);
 assert.match(auth,/Math\.min\(Number\(data\.expires_in\), 3600\)\*1000/);
 assert.match(auth,/JSON\.stringify\(\{nonce,mode,returnTo:cleanReturn\(returnTo\),end:Date\.now\(\)\+3600000\}\)/);
 assert.match(auth,/localStorage\.removeItem\(flowKey\)/);
 assert.match(privacy,/Geen nieuwsbrief of marketingmails zonder je uitdrukkelijke toestemming/);
 assert.match(privacy,/Aucune newsletter ni e-mail marketing sans votre consentement explicite/);
 assert.match(privacy,/Supabase \(ledenaccounts, aanmelden en beschermde inhoud\)/);
 assert.match(privacy,/Supabase \(comptes membres, connexion et contenus protégés\)/);
});
