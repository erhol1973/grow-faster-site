'use strict';
// assets/i18n.js keeps its canonical one-key-per-line source format (key order as written) (25 Nov 2026) so parallel PRs merge per key.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const F=require('../scripts/i18n-format.cjs');
const source=fs.readFileSync(path.join(__dirname,'..','assets','i18n.js'),'utf8');
const run=text=>{const c={window:{}};vm.runInNewContext(text,c);return JSON.parse(JSON.stringify(c.window))};

test('assets/i18n.js is in canonical form: one translation per line (run node scripts/i18n-format.cjs)',()=>{
  assert.ok(F.check(source),'assets/i18n.js is not canonical: run node scripts/i18n-format.cjs');
  const lines=source.split('\n');assert.equal(lines[0],'window.I18N={');
  const [dictionary,html]=F.parse(source);
  assert.equal(lines.length,Object.keys(dictionary).length+Object.keys(html).length+5,'one line per key plus four delimiter lines and the final newline');
});

test('canonical formatting changes layout only, never a translation',()=>{
  const compact='window.I18N={"b":["B","b-fr"],"a":["A","a-fr"]};\nwindow.I18N_HTML={"y":["<em>Y</em>","<em>y</em>"]};\n';
  const formatted=F.format(compact);
  assert.equal(formatted,'window.I18N={\n"b":["B","b-fr"],\n"a":["A","a-fr"]\n};\nwindow.I18N_HTML={\n"y":["<em>Y</em>","<em>y</em>"]\n};\n','key order as written');
  assert.deepEqual(run(formatted).I18N,run(compact).I18N);assert.deepEqual(run(formatted).I18N_HTML,run(compact).I18N_HTML);
  assert.equal(F.format(formatted),formatted,'idempotent');
  const live=run(source),again=run(F.format(source));assert.deepEqual(again.I18N,live.I18N);assert.deepEqual(again.I18N_HTML,live.I18N_HTML);
});

test('single-line, duplicate-key and malformed sources are rejected',()=>{
  assert.equal(F.check('window.I18N={"a":["A","a"]};\nwindow.I18N_HTML={};\n'),false,'single line');
  assert.equal(F.check('window.I18N={\n"b":["B","b"],\n"a":["A","a"]\n};\nwindow.I18N_HTML={\n\n};\n'),true,'any key order is canonical');
  assert.equal(F.check('window.I18N={\n"a":["A","a"], "b":["B","b"]\n};\nwindow.I18N_HTML={\n\n};\n'),false,'two keys on one line');
  assert.equal(F.check('window.I18N={\n"a":["A","a"],\n"a":["A","b"]\n};\nwindow.I18N_HTML={\n\n};\n'),false,'duplicate key');
  assert.throws(()=>F.parse('window.I18N=Object.assign(window.I18N||{},{});'),/expected window\.I18N/);
});
