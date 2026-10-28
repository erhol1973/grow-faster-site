const {test}=require('node:test');const assert=require('node:assert/strict');const {inspectText,scan}=require('../scripts/security.cjs');const path=require('node:path');
test('scanner accepts normal public metadata and safe references',()=>{assert.deepEqual(inspectText('safe.html','<a href="https://example.org">Public</a><script src="assets/site.js"></script>'),[])});
test('scanner detects synthetic secret and executable URL fixtures',()=>{for(const fixture of ['-----BEGIN '+'PRIVATE KEY-----','gh'+'p_'+'A'.repeat(36),'AK'+'IA'+'A'.repeat(16),'<a href="java'+'script:alert(1)">'])assert.equal(inspectText('fixture',fixture).length,1)});
test('deploy artifact contains no recognized secret or executable URL pattern',()=>{assert.deepEqual(scan(path.resolve(__dirname,'..','dist')),[])});
