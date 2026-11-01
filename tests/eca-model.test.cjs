'use strict';
const assert=require('node:assert/strict');
const ECA=require('../assets/eca.js');
function all(v){return Object.fromEntries(Object.values(ECA.QUESTIONS).flat().map(q=>[q,v]));}
assert.equal(ECA.value(1),0);assert.equal(ECA.value(5),100);assert.equal(ECA.value(''),null);assert.equal(ECA.value(6),null);
assert.equal(ECA.band(39),'fragmented');assert.equal(ECA.band(40),'constrained');assert.equal(ECA.band(59),'constrained');assert.equal(ECA.band(60),'partially_aligned');assert.equal(ECA.band(74),'partially_aligned');assert.equal(ECA.band(75),'coherent');assert.equal(ECA.band(89),'coherent');assert.equal(ECA.band(90),'highly_coherent');
let r=ECA.score(all(4));assert.equal(r.sufficient,true);assert.equal(r.displayScore,75);assert.equal(r.band,'coherent');assert.equal(r.primaryConstraints.length,5);assert.equal(r.strongestMechanisms.length,5);
let a=all(4);a.S1='';a.S2='';r=ECA.score(a);assert.equal(r.sufficient,false);assert.equal(r.dimensionScores.strategic,null);
a=all(3);['S1','S2','S3','S4'].forEach(q=>a[q]=5);['D1','D2','D3','D4'].forEach(q=>a[q]=2);r=ECA.score(a);assert.ok(r.patterns.includes('strategy_execution_gap'));
a=all(3);['O1','O2','O3','O4','D1','D2','D3','D4'].forEach(q=>a[q]=2);r=ECA.score(a);assert.ok(r.patterns.includes('coordination_overload'));
a=all(3);['T1','T2','T3','T4'].forEach(q=>a[q]=4);['O1','O2','O3','O4','D1','D2','D3','D4','C1','C2','C3','C4'].forEach(q=>a[q]=2);r=ECA.score(a);assert.ok(r.patterns.includes('ai_absorption_gap'));
a=all(4);['C1','C2','C3','C4'].forEach(q=>a[q]=2);r=ECA.score(a);assert.ok(r.patterns.includes('local_optimization'));
a=all(4);['D1','D2','D3','D4'].forEach(q=>a[q]=2);r=ECA.score(a);assert.ok(r.patterns.includes('governance_drag'));
console.log('ECA model fixtures passed');
