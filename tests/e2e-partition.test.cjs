'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
function configuration(partition){
 const file=require.resolve('../playwright.config.cjs'),previous=process.env.TEST_E2E_PARTITION;
 try{if(partition===undefined)delete process.env.TEST_E2E_PARTITION;else process.env.TEST_E2E_PARTITION=partition;delete require.cache[file];return require(file);}
 finally{delete require.cache[file];if(previous===undefined)delete process.env.TEST_E2E_PARTITION;else process.env.TEST_E2E_PARTITION=previous;}
}
test('base partition excludes exactly the mandatory typography files and isolated journey tree',()=>{
 const full=configuration(),base=configuration('base');
 assert.deepEqual(full.testIgnore,[]);
 assert.deepEqual(base.testIgnore,['**/typography.spec.cjs','**/typography-states.spec.cjs','**/decision-journey/**']);
 assert.deepEqual(base.projects.map(({testIgnore,...rest})=>rest),full.projects.map(({testIgnore,...rest})=>rest));
 assert.deepEqual(base.projects.map(p=>p.name),['firefox','webkit','mobile-webkit','chromium','mobile']);
 for(const name of ['mobile','mobile-webkit']){
  assert.deepEqual(full.projects.find(p=>p.name===name).testIgnore,['**/decision-journey/tablet.spec.cjs']);
  assert.deepEqual(base.projects.find(p=>p.name===name).testIgnore,[...base.testIgnore,'**/decision-journey/tablet.spec.cjs']);
 }
 for(const name of ['firefox','webkit','chromium']){
  assert.equal(base.projects.find(p=>p.name===name).testIgnore,undefined);
  assert.equal(full.projects.find(p=>p.name===name).testIgnore,undefined);
 }
});
