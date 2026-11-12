'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const referenceCommit = '9f3a0ddbd7fa0d3dc548a2ba17b66a816f946d10';
const templateHash = '3c98575b19bd0f0b3e039aa28db889812657f5edf2b90fdd84658f4bfdd91d50';
let cached;
function historicalFile(relativePath) {
  return execFileSync('git', ['show', referenceCommit + ':' + relativePath], { cwd: root, encoding:'utf8' });
}
// Used only by isolated acceptance and initial provisioning. Subsequent private
// editions are maintained outside Git and delivered by the authenticated gateway.
function edition() {
  if (cached) return cached;
  const body = historicalFile('baies-dev/index.html').match(/<body>([\s\S]*?)<\/body>/i)[1];
  if (crypto.createHash('sha256').update(body).digest('hex') !== templateHash) throw new Error('Unexpected reference template');
  const app = historicalFile('assets/baies-dev-app.js');
  const copy = app.slice(app.indexOf('  const dict={'), app.indexOf('  const state='));
  const context = vm.createContext({}, {codeGeneration:{strings:false, wasm:false}});
  vm.runInContext(historicalFile('assets/baies-dev-data.js'), context, {timeout:1000});
  cached = structuredClone({ body, data: context.BAEIS_DEV_DATA, copy: vm.runInContext(copy+'\ndict',context,{timeout:1000}) });
  return cached;
}
function buildRadar(site, out) {
  const preview = fs.readFileSync(path.join(site, 'baies-dev/index.html'), 'utf8')
    .replace('RADAR_BODY_SHA256', templateHash);
  for (const route of ['baies-dev', 'executive-radar']) {
    const dir = path.join(out,route);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'),preview);
  }
}
if (require.main === module) {
  const target = path.join(root,'reports/member-content/radar/current.json');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(edition()),{encoding:'utf8',mode:0o600});
  console.log('Prepared reports/member-content/radar/current.json for private Storage.');
}
module.exports = { buildRadar, edition, historicalFile };