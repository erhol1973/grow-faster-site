'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {routes,deliveryIssues}=require('../scripts/typography-audit.cjs');
test('every built document delivers the canonical policy after component styles',()=>{
 const inventory=routes();assert(inventory.includes('/transformation.html'));assert(inventory.includes('/admin.html'));assert(inventory.includes('/baies-dev/index.html'));
 for(const route of inventory)assert.deepEqual(deliveryIssues(fs.readFileSync(path.join('dist',route),'utf8')),[],route);
});
test('delivery gate rejects a missing policy or a later component stylesheet',()=>{
 assert.notDeepEqual(deliveryIssues('<head><link rel="stylesheet" href="assets/site.css"></head>'),[]);
 assert.notDeepEqual(deliveryIssues('<head><link rel="stylesheet" href="assets/typography.css"><style>h2{font-size:5px}</style></head>'),[]);
 assert.deepEqual(deliveryIssues('<head><style>h2{font-size:5px}</style><link rel="stylesheet" href="../../assets/typography.css?v=1"></head>'),[]);
});
test('component CSS cannot compete with the canonical font and role priority',()=>{
 for(const file of fs.readdirSync('assets').filter(f=>f.endsWith('.css')&&f!=='typography.css')){
  assert.doesNotMatch(fs.readFileSync(path.join('assets',file),'utf8'),/(?:^|[;{])\s*(?:font-size|font-family|font)\s*:[^;{}]*!important\b/i,file);
 }
});
