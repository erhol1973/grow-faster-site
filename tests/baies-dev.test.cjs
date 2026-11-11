'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const core=require('../assets/baies-dev-core.js');
const data=require('../assets/baies-dev-data.js');
const html=fs.readFileSync(path.join(root,'baies-dev','index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/baies-dev-app.js'),'utf8');

test('BAEIS dev: five unique, evidence-linked source records',()=>{
  assert.equal(data.records.length,5);
  assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
  for(const record of data.records){
    assert.deepEqual(core.checkRecord(record),[],record.id);
    assert.ok(core.sourceIsApproved(record.url));
    assert.ok(record.published<=data.snapshotDate,'future dated claim');
    assert.ok(record.claim.nl.length>30);
    assert.ok(record.limit.fr.length>30);
    assert.ok(record.decision.nl.length>30);
  }
});

test('BAEIS dev: signal score is deterministic and bounded',()=>{
  assert.equal(core.scoreSignal({belgium:0,value:0,urgency:0,evidence:0,cross:0}),0);
  assert.equal(core.scoreSignal({belgium:5,value:5,urgency:5,evidence:5,cross:5}),100);
  assert.equal(Object.values(core.weights).reduce((a,b)=>a+b,0),100);
  assert.throws(()=>core.scoreSignal({belgium:6,value:3,urgency:3,evidence:3,cross:3}),RangeError);
  assert.throws(()=>core.scoreSignal({belgium:NaN,value:3,urgency:3,evidence:3,cross:3}),RangeError);
  assert.throws(()=>core.scoreSignal({belgium:2.5,value:3,urgency:3,evidence:3,cross:3}),RangeError);
});

test('BAEIS dev: malicious/unsanctioned URLs rejected',()=>{
  assert.equal(core.sourceIsApproved('https://statbel.fgov.be.evil.example/claim'),false);
  assert.equal(core.sourceIsApproved('http://statbel.fgov.be/claim'),false);
  assert.equal(core.sourceIsApproved('https://test:test@statbel.fgov.be/claim'),false);
  assert.equal(core.sourceIsApproved('javascript:alert(1)'),false);
  assert.equal(core.sourceIsApproved('https://www.nbb.be/nl'),true);
});

test('BAEIS dev: review state machine requires each step',()=>{
  const r=data.records[0];
  assert.equal(core.nextStage('intake',r),'source-checked');
  assert.equal(core.nextStage('source-checked',r),'challenge-checked');
  assert.equal(core.nextStage('challenge-checked',r),'preview-approved');
  assert.throws(()=>core.nextStage('preview-approved',r),/blocked/i);
  assert.throws(()=>core.nextStage('published',r),/blocked/i);
  const corrupt={...r,url:'https://unapproved.example.org/news'};
  assert.throws(()=>core.nextStage('intake',corrupt),/evidence/i);
});

test('BAEIS dev: external publishing stays prohibited even after preview approval',()=>{
  assert.equal(core.canPublishExternally('preview-approved'),false);
  assert.equal(core.canPublishExternally('admin'),false);
  assert.match(html,/<button[^>]*id="external-publish"[^>]*disabled/i);
  assert.doesNotMatch(app,/(fetch\s*\(|XMLHttpRequest|sendBeacon|\.post\s*\()/i);
  assert.doesNotMatch(app,/localStorage|sessionStorage/i);
  assert.match(html,/noindex,nofollow,noarchive/);
});

test('BAEIS dev: strategic and sector filters produce expected subsets',()=>{
  const ceo=core.filterRecords(data.records,'CEO','All','');
  assert.ok(ceo.length>=3);
  assert.ok(ceo.every(r=>r.roles.includes('CEO')));
  const manufacturing=core.filterRecords(data.records,'ALL','Manufacturing','');
  assert.equal(manufacturing.length,1);
  assert.equal(manufacturing[0].id,'BE-EC-004');
  assert.equal(core.filterRecords(data.records,'CIO','Manufacturing','').length,0);
  assert.equal(core.filterRecords(data.records,'ALL','All','non-existent-keyword').length,0);
});

test('BAEIS dev: isolated NL/FR accessible markup and static asset linkage',()=>{
  assert.match(html,/lang="nl-BE"/);
  for(const view of ['overview','radar','evidence','editorial','about']){
    assert.match(html,new RegExp(`id="${view}"`));
    assert.match(html,new RegExp(`data-view="${view}"`));
  }
  assert.match(html,/<main id="main"/);
  assert.match(html,/id="language-switch"/);
  assert.match(html,/id="signup-consent" required/);
  assert.match(html,/role="status"/);
  assert.match(html,/assets\/baies-dev\.css/);
  for(const asset of ['baies-dev.css','baies-dev-core.js','baies-dev-data.js','baies-dev-app.js'])assert.ok(fs.statSync(path.join(root,'assets',asset)).isFile());
});
test('BAEIS branding: exact solid four-bar transparent logo variants and favicon',()=>{
  for(const [variant,ink] of [['dark','#0B2545'],['white','#FFFFFF']]){
    const svg=fs.readFileSync(path.join(root,'img',`baies-dev-logo-${variant}.svg`),'utf8');
    assert.equal((svg.match(/<rect /g)||[]).length,4);
    assert.match(svg,/>Grow Faster<\/text>/);
    assert.ok(svg.includes(`fill="${ink}"`));
    assert.match(svg,/fill="#2189E1"/);
    assert.doesNotMatch(svg,/gradient|filter|opacity|<image|<script|stroke=/i);
    const png=fs.readFileSync(path.join(root,'img',`baies-dev-logo-${variant}.png`));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png[25],6,'RGBA transparent PNG');
  }
  assert.match(html,/rel="icon"[^>]*baies-dev-favicon.svg/);
  assert.match(html,/class="brand-logo"[^>]*baies-dev-logo-white.svg/);
  const css=fs.readFileSync(path.join(root,'assets/baies-dev.css'),'utf8');
  assert.match(css,/--brand-navy:#0B2545/);
  assert.match(css,/--brand-blue:#2189E1/);
  assert.match(css,/font-family:"Aptos","Hanken Grotesk","Segoe UI",Helvetica,Arial,sans-serif/);
  assert.match(css,/--text-body:17px/);
});

test('BAEIS navigation: isolated native routes, explicit locale choice and safe disclosure',()=>{
  for(const view of ['overview','radar','evidence','editorial','about'])assert.match(html,new RegExp(`<a href="#${view}" data-view="${view}"`));
  assert.match(html,/id="navigation-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="product-links"/);
  for(const lang of ['nl','fr'])assert.match(html,new RegExp(`data-language="${lang}"`));
  assert.match(html,/baies-dev-logo-white\.svg/);
  assert.match(html,/<noscript>/);
  assert.doesNotMatch(app,/localStorage|sessionStorage|fetch\s*\(/);
});
